from pydantic import AnyUrl, BaseSettings, Field, Json, ValidationError, conlist
from pydantic.main import BaseModel

import jwt
from opentdf import NanoTDFClient, OIDCCredentials, LogLevel

from services import addUserEntitlement, refreshTokens

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

class Row(BaseModel):
    __root__: conlist(str, min_items=10, max_items=10)

class SingleBoard(BaseModel):
    __root__: conlist(Row, min_items=10, max_items=10)

class WholeBoard(BaseModel):
    player1: SingleBoard
    player2: SingleBoard

class GamePlayer:
    player = Player()
    board = None
    board_encrypted = None
    ships = None
    guesses = None
    ready = False

    def __init__(self, name, access_token, refresh_token=None):
        self.player.name=name
        self.player.access_token=access_token
        self.player.refresh_token=refresh_token
        decoded = jwt.decode(token, options={"verify_signature": False})
        self.player.username=decoded["preferred_username"]

    def encryptBoard(self, oidc_creds):
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

                encrypted_string = client.encrypt_string(board[i][j])

                encrypted_board[i].append(encrypted_string)

        self.board_encrypted = encrypted_board
        self.ready = True

    def makeGuess(self, row, col):
        self.guesses.append(str(row)+str(col))
        addUserEntitlement(self.player.username, self.player.name, row, col)

    def refreshPlayerTokens(self):
        new_access, new_refresh = refreshTokens(self.player.refresh_token)
        self.player.refresh_token = new_refresh
        self.player.access_token = new_access

class Game:
    status = 1
    opentdf_oidccreds = None
    player1 = None
    player2 = None

    def __init__(self):
        oidc_creds = OIDCCredentials()
        oidc_creds.set_client_credentials_client_secret(
            client_id=BACKEND_CLIENTID,
            client_secret=BACKEND_CLIENT_SECRET,
            organization_name=REALM,
            oidc_endpoint=OIDC_ENDPOINT,
        )
        self.opentdf_oidccreds = oidc_creds

    """
    Return whole encrypted board -- whats given to front end
    """
    def getWholeBoard(self):
        return {"player1": self.player1.board_encrypted, "player2": self.player2.board_encrypted}

    """
    Setup the players, assign player1 or player2, get username, set board
    """
    def setupPlayer(self, access_token, board_unencrypted):
        if not self.player1 and not self.player2:
            name = "player1"
            self.player1 = GamePlayer(name, access_token)
            self.player1.board = board_unencrypted
            self.player1.ships = _getShips(self.player1.board)
            self.player1.guesses = []
            return name, self.player1.player.username
        elif self.player1 is not None and not self.player2:
            name="player2"
            self.player2 = GamePlayer(name, access_token)
            self.player2.board = board_unencrypted
            self.player2.ships = _getShips(self.player2.board)
            self.player2.guesses = []
            return name, self.player2.player.username
        else:
            raise Error("Both players already set")

    # """
    # Encrypt both player's board with appropriate attrs and store in encrypted_board
    # """
    # def encryptBoards(self):
    #     self.player1.board_encrypted = self._encryptBoard(self.player1)
    #     self.player2.board_encrypted = self._encryptBoard(self.player2)
        
    """
    Check if a player has won
    """
    def victoryCheck(self):
        if set(self.player2.ships).issubset(set(self.player1.guesses)):
            self.status = Status.p1_victory
            return True
        elif set(self.player1.ships).issubset(set(self.player2.guesses)):
            self.status = Status.p2_victory
            return True
        return False

"""
Get the positions of ships on board
"""
def _getShips(board):
    ships = []
    for i in range(len(board)):
        for j in range(len(board[i])):
            if board[i][j] == SHIP:
                ships.append(str(i)+str(j))
    return ships

"""
Check if board is a valid board
"""
def validBoard(board):
    ## todo
    return True


