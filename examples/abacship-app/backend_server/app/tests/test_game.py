from ..game import *
from .test_data import *
import pytest
from fastapi import HTTPException


def test_valid_board():
    assert validBoard(VALID_BOARD)
    assert validBoard(VALID_BOARD_2)

    with pytest.raises(HTTPException):
        validBoard(INVALID_BOARD_MISSING)

    with pytest.raises(HTTPException):
        validBoard(INVALID_BOARD_EXTRA)  


def test_random_board():
    # test 5 boards:
    for _ in range(5):
        rand_board = genRandomBoard()
        assert validBoard(rand_board)


def test_setup_player():
    # filled players
    game = Game()
    game.player1 = "i am player 1"
    game.player2 = "i am player 2"
    with pytest.raises(HTTPException) as e:
        game.setupPlayer(ACCESS_TOKEN, VALID_BOARD, "player1", REFRESH_TOKEN)
    assert "Player 1 already set" in str(e)
    with pytest.raises(HTTPException) as e:
        game.setupPlayer(ACCESS_TOKEN, VALID_BOARD, "player2", REFRESH_TOKEN)
    assert "Player 2 already set" in str(e)

    # with name != player 1 or 2
    game = Game()
    with pytest.raises(HTTPException) as e:
        game.setupPlayer(ACCESS_TOKEN, VALID_BOARD, "player3", REFRESH_TOKEN)
    assert "Player name must be player1 or player2" in str(e)

    # setup player 1
    game = Game()
    username = game.setupPlayer(ACCESS_TOKEN, VALID_BOARD, "player1", REFRESH_TOKEN)
    assert username == "user1"
    ships = [str(i)+str(j)
     for i in range(len(VALID_BOARD))
      for j in range(len(VALID_BOARD[i]))
       if VALID_BOARD[i][j] != OCEAN]
    assert game.player1.ships == ships
    assert game.player1.player.access_token == ACCESS_TOKEN

    # setup player 2
    username = game.setupPlayer(ACCESS_TOKEN, VALID_BOARD_2, "player2", REFRESH_TOKEN)
    assert username == "user1"
    ships = [str(i)+str(j)
     for i in range(len(VALID_BOARD_2))
      for j in range(len(VALID_BOARD_2[i]))
       if VALID_BOARD_2[i][j] != OCEAN]
    assert game.player2.ships == ships
    assert game.player2.player.access_token == ACCESS_TOKEN


def test_get_whole_board():
    # empty board
    game = Game()
    assert game.getWholeBoard() == {"player1": [], "player2": []}

    #just one player
    game.setupPlayer(ACCESS_TOKEN, VALID_BOARD_2, "player2", REFRESH_TOKEN)
    game.player2.board_encrypted = [["encrypted board test player 2"]]
    assert game.getWholeBoard() == {"player1": [], "player2": [["encrypted board test player 2"]]}

    # both players
    game.setupPlayer(ACCESS_TOKEN, VALID_BOARD, "player1", REFRESH_TOKEN)
    game.player1.board_encrypted = [["encrypted board test player 1"]]
    assert game.getWholeBoard() == {"player1": [["encrypted board test player 1"]],
     "player2": [["encrypted board test player 2"]]}


def test_record_turn():
    game = Game()
    assert game.turns == []

    # one turn
    game.recordTurn("player1", 8, 9)
    assert len(game.turns) == 1
    assert game.turns[0] == Turn("player1", 8, 9)

    # multiple turns
    game.recordTurn("player2", 2, 3)
    assert len(game.turns) == 2
    assert game.turns[1] == Turn("player2", 2, 3)


def test_last_turn():
    # no turns
    game = Game()
    assert (None, None, None) == game.getLastTurn()

    # one turn
    game.recordTurn("player1", 8, 9)
    assert ("player1", 8, 9) == game.getLastTurn()

    # multuple turns
    game.recordTurn("player2", 2, 3)
    assert ("player2", 2, 3) == game.getLastTurn()


def test_victory_check():
    # just set up game
    game = Game()
    assert not game.victoryCheck()
    game.setupPlayer(ACCESS_TOKEN, VALID_BOARD, "player1", REFRESH_TOKEN)
    assert not game.victoryCheck()
    game.setupPlayer(ACCESS_TOKEN, VALID_BOARD_2, "player2", REFRESH_TOKEN)
    assert not game.victoryCheck()

    # one hit short
    game.player1.guesses = game.player2.ships[:-1]
    assert not game.victoryCheck()

    # exact guesses = ships
    game.player1.guesses = game.player2.ships
    assert game.victoryCheck()
    assert game.status == Status.p1_victory

    # extra guesses
    game.status == Status.setup
    game.player1.guesses = game.player2.ships + ["99", "88", "11"]
    assert game.victoryCheck()
    assert game.status == Status.p1_victory

    # one hit short
    game.status == Status.setup
    game.player1.guesses = []
    game.player2.guesses = game.player1.ships[:-1]
    assert not game.victoryCheck()

    # exact guesses = ships
    game.player2.guesses = game.player1.ships
    assert game.victoryCheck()
    assert game.status == Status.p2_victory

    # extra guesses
    game.status == Status.setup
    game.player2.guesses = game.player1.ships + ["99", "88", "11"]
    assert game.victoryCheck()
    assert game.status == Status.p2_victory


def test_reset():
    game = Game()
    game.setupPlayer(ACCESS_TOKEN, VALID_BOARD, "player1", REFRESH_TOKEN)
    game.setupPlayer(ACCESS_TOKEN, VALID_BOARD_2, "player2", REFRESH_TOKEN)
    game.status = Status.p1_turn
    game.reset()
    assert game.player1 is None and game.player2 is None and game.status == Status.setup and game.turns == []

