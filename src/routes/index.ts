import { Router } from 'express'
import users from './users.routes'
import auth from './auth.routes'
// import status from './status.routes.js'

const router: Router = Router()

router.use('/users', users)
router.use('/otp', auth)

export default router