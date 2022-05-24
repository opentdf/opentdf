import Home from "./components/home"
import Info from './components/info'
import "rsuite/dist/rsuite.min.css";


function App() {
  return (
    <div>
      <Home />
      <br></br>
      <Info className='info-section' />
    </div>
  );
}

export default App;
