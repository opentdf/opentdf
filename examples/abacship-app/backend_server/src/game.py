from pydantic import AnyUrl, BaseSettings, Field, Json, ValidationError, conlist
from pydantic.main import BaseModel
from enum import Enum
from typing import Optional, List, Literal
from fastapi import HTTPException
from http.client import NO_CONTENT, BAD_REQUEST, ACCEPTED

import jwt
import base64
import logging
from logging.config import dictConfig
import sys
from opentdf import NanoTDFClient, OIDCCredentials, LogLevel

from services import addUserEntitlement, refreshTokens
from constants import *

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

class GamePlayer:
    board = None
    board_encrypted = None
    ships = None
    guesses = None
    ready = False
    
    def __init__(self, name, access_token, refresh_token=None):
        self.player = Player(name=name, access_token=access_token, refresh_token=refresh_token)
        # self.player.name=name
        # self.player.access_token=access_token
        # self.player.refresh_token=refresh_token
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
        for i in range(len(self.board)):
            encrypted_board.append([])
            for j in range(len(self.board[i])):
                client = NanoTDFClient(oidc_credentials=oidc_creds, kas_url=KAS_URL)
                client.enable_console_logging(LogLevel.Error)

                client.add_data_attribute(board_attr, KAS_URL)
                client.add_data_attribute(attr_base+str(i)+str(j), KAS_URL)

                encrypted_string = base64.b64encode(client.encrypt_string(self.board[i][j]))

                encrypted_board[i].append(encrypted_string)

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
    status = 1
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
        self.status = 1
        self.player1 = None
        self.player2 = None

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
    logger.debug("Validating submitted board")
    simple_board = [[SHIP if x != OCEAN else x for x in row] for row in board]
    ## basic checks
    _validateBoard(simple_board)
    return _checkBoard(simple_board, 0)

def _checkBoard(currentBoard, shipSizePos):
    if (shipSizePos >= len(SHIP_SIZES)):
        return True
    currentSizeShips = _findPossibleShips(currentBoard, SHIP_SIZES[shipSizePos])
    valid = False
    for ship in currentSizeShips:
        if (_checkBoard(_removeShipFromBoard(currentBoard, ship), shipSizePos + 1)):
            return True
    return valid

def _removeShipFromBoard(board, ship):
    newBoard = [[None]*SIZE for _ in range(SIZE)]
    for r in range(SIZE):
        for c in range(SIZE):
            if ((ship.orientation == HORIZONTAL and r == ship.row and (c >= ship.col and c < ship.col + ship.size))
                    or (ship.orientation == VERTICAL and c == ship.col and (r >= ship.row and r < ship.row + ship.size))):
                newBoard[r][c] = OCEAN
            else:
                newBoard[r][c] = board[r][c]
    return newBoard

def _findPossibleShips(board, size):
    ships = []
    for r in range(SIZE):
        for c in range(SIZE):
            if (board[r][c] == SHIP):
                if (_isPossibleHorizontalShip(board, size, r, c)):
                    ships.append(Ship(r, c, size, HORIZONTAL))
                if (_isPossibleVerticalShip(board, size, r, c)):
                    ships.append(Ship(r, c, size, VERTICAL))
    return ships

def _isPossibleHorizontalShip(board, size, row, col):
    if (SIZE - col < size):
        return False
    c_end = SIZE-1
    for c in range(col, SIZE):
        if board[row][c] != SHIP:
            c_end = c
            break
    return ((c_end - col) >= size)

def _isPossibleVerticalShip(board, size, row, col):
    if (SIZE - col < size):
        return False
    r_end = SIZE-1
    for r in range(row, SIZE):
        if board[r][col] != SHIP:
            r_end = r
            break
    return ((r_end - row) >= size)

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

class Ship:
    def __init__(self, row, col, size, orientation):
        self.row = row
        self.col = col
        self.size = size
        self.orientation = orientation
    