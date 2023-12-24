import { Router } from 'express'
import users from './users.routes.ts'
// import status from './status.routes.js'

const router: Router = Router()

router.use('/users', users)

export default router