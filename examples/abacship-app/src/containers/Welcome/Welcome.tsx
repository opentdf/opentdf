import React from "react";
import { IPlayerState } from "../../recoil-atoms/player";
import "./Welcome.scss";

export function Welcome({ handleClick } : {handleClick: (playerData:IPlayerState)=> void}) {
  const welcomeText = "Welcome !";
  const player1Preset:IPlayerState = {
    id: "player1",
    name: "player1",
    enemyName:"player2"
  };
  const player2Preset:IPlayerState = {
    id: "player2",
    name: "player2",
    enemyName:"player1"
  };

  return (
    <section className="container">
      <div className="content">
        <header>
          <h1>{welcomeText}</h1>
        </header>

        <h2>{"Select player:"}</h2>

        <footer>
          <button className="" onClick={() => handleClick(player1Preset)}>Player 1</button>
          <button className="" onClick={() => handleClick(player2Preset)}>Player 2</button>
        </footer>
      </div>
    </section>);
}
