import app from './app.ts'
import { APP_PORT } from './constants.ts'

// Listen
const port = APP_PORT

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}/`)
})