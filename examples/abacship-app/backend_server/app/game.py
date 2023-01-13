from pydantic import AnyUrl, BaseSettings, Field, Json, ValidationError, conlist
from pydantic.main import BaseModel
from enum import Enum
from typing import Optional, List, Literal
from fastapi import HTTPException
from http.client import NO_CONTENT, BAD_REQUEST, ACCEPTED

import jwt
import random
import base64
import logging
import requests
from logging.config import dictConfig
import sys
from opentdf import NanoTDFClient, OIDCCredentials, LogLevel

from .services import addUserEntitlement, refreshTokens
from .constants import *

dictConfig(LogConfig().dict())
logger = logging.getLogger("abacship")

class Status(int, Enum):
    setup = 1
    p1_turn = 2
    p2_turn = 3
    p1_request_attr_from_p2 = 4
    p2_request_attr_from_p1 = 5
    p1_grants_attr_to_p2 = 6
    p2_grants_attr_to_p1 = 7
    p1_victory = 8
    p2_victory = 9
    backend_processing = 0

class Player(BaseModel):
    name: Literal['player1', 'player2']
    refresh_token: Optional[str] = None
    access_token: Optional[str] = None
    username: Optional[str] = None #ex user1 -- wont need if i have access token

class WholeBoard(BaseModel):
    player1: conlist(conlist(str, min_items=10, max_items=10), min_items=10, max_items=10)
    player2: conlist(conlist(str, min_items=10, max_items=10), min_items=10, max_items=10)

class Turn:
    player = None
    guess = None

    def __init__(self, player, row, col):
        self.guess = (row,col)
        self.player = player

    def __eq__(self, other):
        if not isinstance(other, Turn):
            return False
        return self.player == other.player and self.guess == other.guess

class GamePlayer:
    board = None
    board_encrypted = None
    ships = None
    guesses = None
    ready = False
    
    def __init__(self, name, access_token, refresh_token=None):
        self.player = Player(name=name, access_token=access_token, refresh_token=refresh_token)
        decoded = jwt.decode(access_token, options={"verify_signature": False})
        self.player.username=decoded["preferred_username"]

    """
    Encrypt the unencrypted board of the player with board and square attributes
    """
    def encryptBoard(self, oidc_creds):
        logger.debug(f"Encrypting board of {self.player.name}")
        encrypted_board = []
        attr_base = f"{AUTH_NAMESPACE}/attr/{self.player.name}/value/"
        board_attr = attr_base + "board"

        #get kas public key
        resp = requests.get(KAS_URL+KAS_PUB_KEY_URL)
        kas_key_string = resp.json()
        kas_key_string = kas_key_string.replace("\\n", "\n")

        for i in range(len(self.board)):
            encrypted_board.append([])
            for j in range(len(self.board[i])):
                client = NanoTDFClient(oidc_credentials=oidc_creds, kas_url=EXTERNAL_KAS_URL)
                client.enable_console_logging(LogLevel.Error)

                client.add_data_attribute(board_attr, EXTERNAL_KAS_URL)
                client.add_data_attribute(attr_base+str(i)+str(j), EXTERNAL_KAS_URL)

                client.set_decrypter_public_key(kas_key_string)

                encrypt_string = client.encrypt_string(self.board[i][j])
                encoded_string = base64.b64encode(encrypt_string)

                encrypted_board[i].append(encoded_string)

        self.board_encrypted = encrypted_board
        self.ready = True

    """
    Player guesses there is a ship at row, col
    """
    def makeGuess(self, row, col):
        logger.debug("Player {self.player.name} makes guess {row}, {col}")
        self.guesses.append(str(row)+str(col))
        name = "player1" if self.player.name == "player2" else "player2"
        addUserEntitlement(self.player.username, name, row, col)

    """
    Refresh keycloak tokens for player
    """
    def refreshPlayerTokens(self):
        logger.debug("Refreshing keycloak tokens")
        if self.player.refresh_token is not None:
            new_access, new_refresh = refreshTokens(self.player.refresh_token)
            self.player.refresh_token = new_refresh
            self.player.access_token = new_access

class Game:
    status = Status.setup
    opentdf_oidccreds = None
    player1 = None
    player2 = None
    turns =  None

    def __init__(self):
        oidc_creds = OIDCCredentials()
        oidc_creds.set_client_credentials_client_secret(
            client_id=BACKEND_CLIENTID,
            client_secret=BACKEND_CLIENT_SECRET,
            organization_name=REALM,
            oidc_endpoint=OIDC_ENDPOINT,
        )
        self.opentdf_oidccreds = oidc_creds
        self.turns = []

    """
    Return whole encrypted board -- whats given to front end
    """
    def getWholeBoard(self):
        logger.debug("Get whole board")
        return {"player1": self.player1.board_encrypted if self.player1 is not None else [],
         "player2": self.player2.board_encrypted if self.player2 is not None else []}

    """
    Setup the players, assign player1 or player2, get username, set board
    """
    def setupPlayer(self, access_token, board_unencrypted, name, refresh_token=None):
        if name=="player1" and self.player1 is not None:
            raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Player 1 already set",
        ) 
        if name=="player2" and self.player2 is not None:
            raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Player 2 already set",
        ) 
        if name == "player1":
            self.player1 = GamePlayer(name, access_token, refresh_token)
            self.player1.board = board_unencrypted
            self.player1.ships = _getShips(self.player1.board)
            self.player1.guesses = []
            return self.player1.player.username
        elif name=="player2":
            self.player2 = GamePlayer(name, access_token, refresh_token)
            self.player2.board = board_unencrypted
            self.player2.ships = _getShips(self.player2.board)
            self.player2.guesses = []
            return self.player2.player.username
        else:
            raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Player name must be player1 or player2",
        )

    """
    A player takes a turn
    """
    def recordTurn(self, name, row, col):
        self.turns.append(Turn(name, row, col))

    """
    Get the last turn taken
    """
    def getLastTurn(self):
        if not self.turns:
            return None, None, None
        last_turn = self.turns[-1]
        return last_turn.player, last_turn.guess[0], last_turn.guess[1]
        
    """
    Check if a player has won
    """
    def victoryCheck(self):
        logger.debug("Victory check")
        if self.player1 is None or self.player2 is None:
            return False
        if set(self.player2.ships).issubset(set(self.player1.guesses)):
            self.status = Status.p1_victory
            return True
        elif set(self.player1.ships).issubset(set(self.player2.guesses)):
            self.status = Status.p2_victory
            return True
        return False

    """
    Reset the game
    """
    def reset(self):
        self.status = Status.setup
        self.player1 = None
        self.player2 = None
        self.turns = []

"""
Get the positions of ships on board
"""
def _getShips(board):
    ships = []
    for i in range(len(board)):
        for j in range(len(board[i])):
            if board[i][j] != OCEAN:
                ships.append(str(i)+str(j))
    return ships

"""
Check if board is a valid board
There must be one aircraft carrier (size 5), one battleship (size 4), one cruiser (size 3), 2 destroyers (size 2) and 2 submarines (size 1).
"""
def validBoard(board):
    simple_board = [[SHIP if x != OCEAN else x for x in row] for row in board]
    _validateBoard(simple_board)
    board_dup = [row[:] for row in board]
    valid = _checkBoard(board_dup)
    if not valid:
        raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Invalid board",
        )
    return valid

def _checkBoard(board):
    return _findCarrier(board) and _findBattleship(board) and _findCruiser(board) and _findDestroyer(board) and _findSubmarine(board)

def _findShips(board, length, title, total, total_found):
    if total == total_found:
        # make sure there are no more
        if any(title in row for row in board):
            print("extra")
            return False
        return True
    # look through the board row by row to find the name
    for row_num in range(SIZE):
        for pos_num in range(SIZE):
            if board[row_num][pos_num]==title:
                valid_ship = False
                # check if it could be horizontal
                if (pos_num + length - 1) <= (SIZE - 1):
                    #could be horizontal
                    if [title for _ in range(length)] == board[row_num][pos_num:pos_num+length]:
                        valid_ship = True
                        # remove the ship
                        new_board = board.copy()
                        new_board[row_num][pos_num:pos_num+length] = [OCEAN for _ in range(length)]
                # check if it could be vertical
                if (not valid_ship) and (row_num + length - 1) <= (SIZE - 1):
                    if [title for _ in range(length)] == [board[x][pos_num] for x in range(row_num, row_num+length)]:
                        valid_ship = True
                        # remove the ship
                        new_board = board.copy()
                        for row in range(row_num, row_num+length):
                            new_board[row][pos_num] = OCEAN
                if valid_ship:
                    return _findShips(new_board, length, title, total, total_found+1)
    return False

def _findCarrier(board):
    return _findShips(board, AIRCRAFT.size, AIRCRAFT.name, SHIPS.count(AIRCRAFT), 0)

def _findBattleship(board):
    return _findShips(board, BATTLESHIP.size, BATTLESHIP.name, SHIPS.count(BATTLESHIP), 0)

def _findCruiser(board):
    return _findShips(board, CRUISER.size, CRUISER.name, SHIPS.count(CRUISER), 0)

def _findDestroyer(board):
    return _findShips(board, DESTROYER.size, DESTROYER.name, SHIPS.count(DESTROYER), 0)

def _findSubmarine(board):
    return _findShips(board, SUBMARINE.size, SUBMARINE.name, SHIPS.count(SUBMARINE), 0)

def _countShips(board):
    ones = 0
    for r in range(SIZE):
        for c in range(SIZE):
            if board[r][c]==SHIP:
                ones += 1
    return ones

def _validateBoard(board):
    for r in range(SIZE):
        for c in range(SIZE):
            if not (board[r][c] == OCEAN or board[r][c] == SHIP):
                raise HTTPException(
                    status_code=BAD_REQUEST,
                    detail="Invalid board: Illegal character at {r}, {c}",
                )
    if _countShips(board) != (sum(SHIP_SIZES) + NR_OF_ONES):
        raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Wrong number of ship pieces",
        )
    

"""
Create random board
"""
def genRandomBoard():
    logger.debug("Generating random board")
    board = [[OCEAN for _ in range(SIZE)] for _ in range(SIZE)]
    for ship in SHIPS:
        board = _placeRandom(board, ship)
    try:
        validBoard(board)
    except:
        board = genRandomBoard()
    finally:
        return board
    
def _place(board, ship, orientation, row, column):
    for i in range(ship.size):
      t = board[row][column]
      if t != OCEAN:
        raise Exception
      if orientation==VERTICAL:
        row += 1
      else:
        column += 1
    for i in range(ship.size):
      if orientation==VERTICAL:
        row -= 1
      else:
        column -= 1
      board[row][column] = ship.name
    return board
  
def _placeRandom(board, ship):
    logger.debug(f"Trying to place {ship.name}")
    for i in range(200): #200 - just need a big number
        try:
            orientation = random.choice([VERTICAL, HORIZONTAL])
            lx = 1 if orientation==VERTICAL else ship.size
            ly = ship.size if orientation==VERTICAL else 1
            r = random.choice(list(range(SIZE - ly)))
            c = random.choice(list(range(SIZE - lx)))
            board = _place(board, ship, orientation, r, c)
            return board
        except Exception as e:
            logger.debug(e)
            continue
    raise Exception(f"Unable to place {ship.name}")

    