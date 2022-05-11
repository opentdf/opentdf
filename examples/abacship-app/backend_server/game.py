from pydantic import AnyUrl, BaseSettings, Field, Json, ValidationError, conlist
from pydantic.main import BaseModel

class Status(int, Enum):
    setup = 1
    p1_turn = 2
    p2_turn = 3
    p1_request_attr_from_p2 = 4
    p2_request_attr_from_p1 = 5
    p1_victory = 6
    p2_victory = 7
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


class Game:
    status = 1
    player1 = None
    player2 = None
    player1_board = None
    player2_board= None
    player1_ships = None
    player2_ships = None
    player1_guesses = None
    player2_guesses = None
    keycloak_admin = None
    keycloak_oidc = None

    def get_whole_board(self):
        return {"player1": self.player1_board, "player2": self.player2_board}
    


"""
Check if board is a valid board
"""
def valid_board(board):
    return True