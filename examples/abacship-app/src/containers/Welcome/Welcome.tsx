import React from "react";
import "./Welcome.scss";

export function Welcome({ handleClick } : {handleClick: (val: string)=> void}) {
  const welcomeText = "Welcome !";

  return (
    <section className="container">
      <div className="content">
        <header>
          <h1>{welcomeText}</h1>
        </header>

        <h2>{"Select player:"}</h2>

        <footer>
          <button className="" onClick={() => handleClick("Player1")}>Player 1</button>
          <button className="" onClick={() => handleClick("Player2")}>Player 2</button>
        </footer>
      </div>
    </section>);
}
