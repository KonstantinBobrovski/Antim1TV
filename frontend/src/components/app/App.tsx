import { AlertsBox } from '../alertsBox/alertsBox';
import { AppRouter } from '../app.router';
import { AppNavbar } from '../navbar/navbar';
import { Stars } from '../stars/stars';
import './app.sass'
function App() {
  return (
    <>
      <AppNavbar />
      <AlertsBox />
      <Stars />
      <div className='page-wrapper'>
        <AppRouter />
      </div>
    </>

  );
}

export default App;