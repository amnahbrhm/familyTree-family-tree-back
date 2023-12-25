import { Router } from 'express'
import users from './users.routes.ts'
import auth from './auth.routes.ts'
// import status from './status.routes.js'

const router: Router = Router()

router.use('/users', users)
router.use('/otp', auth)

export default router