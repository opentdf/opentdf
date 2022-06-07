import React from "react";
import { ASSETS_LIST } from "../../assets";
import { IPlayerState } from "../../recoil-atoms/player";
import "./Welcome.scss";

const { IMAGES } = ASSETS_LIST;

export function Welcome({ handleClick }: { handleClick: (playerData: IPlayerState) => void }) {
  const welcomeText = "Welcome !";
  const player1Preset: IPlayerState = {
    id: "player1",
    name: "player1",
    enemyName: "player2"
  };
  const player2Preset: IPlayerState = {
    id: "player2",
    name: "player2",
    enemyName: "player1"
  };

  return (
    <section className="container">
      <div className="content">
        <header>
          <h1><b>Welcome to</b></h1>
        </header>
        <div className="logo">
          <img alt="logo" src={IMAGES.abacship_img} />
        </div>

        <p>{"Select player:"}</p>

        <footer>
          <button className="player1" onClick={() => handleClick(player1Preset)}>Player 1</button>
          <button className="player2" onClick={() => handleClick(player2Preset)}>Player 2</button>
        </footer>
      </div>
    </section>);
}
