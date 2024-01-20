import app from './app'
import { APP_PORT } from './constants'
// import axios from 'axios'
// axios.post('http://localhost:4300/chat/sendmessage/966556004181', {
//   message: 'Hello World',
// })
//   .then(function (response: any) {
//     console.log(response);
//   })
//   .catch(function (error: any) {
//     console.log(error);
//   });
// Listen

const port = APP_PORT

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}/`)
})