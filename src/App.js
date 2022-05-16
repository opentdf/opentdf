import { Affix } from "rsuite";
import NavigationBar from "./components/nav-bar";
import './App.css';

function App() {
  return (
    <div>
      <Affix>
        <NavigationBar></NavigationBar>
      </Affix>
    </div>
  );
}

export default App;
