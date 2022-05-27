import React from "react";
import "./Welcome.scss";

export function Welcome({ handleClick } : {handleClick: (player: string, enemy: string)=> void}) {
  const welcomeText = "Welcome !";

  return (
    <section className="container">
      <div className="content">
        <header>
          <h1>{welcomeText}</h1>
        </header>

        <h2>{"Select player:"}</h2>

        <footer>
          <button className="" onClick={() => handleClick("player1", "player2")}>Player 1</button>
          <button className="" onClick={() => handleClick("player2", "player1")}>Player 2</button>
        </footer>
      </div>
    </section>);
}
