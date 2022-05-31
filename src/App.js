import Home from "./components/home"
import Info from './components/info'
import NavigationBar from "./components/nav-bar";
import { Container, Header, Content, Footer } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import { headerFooterStyle as footerStyle } from './styles'

function App() {
  return (
    <Container>
      <Header>
      <NavigationBar/>
      </Header>
      <Content>
        <Home />
        <Info className="info-section" />
      </Content>
        <Footer style={footerStyle} />
    </Container>
  );
}

export default App;
