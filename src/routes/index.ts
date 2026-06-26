import { Router } from 'express'
import users from './users.routes'
import auth from './auth.routes'
import members from './members.routes'
import tree from './tree.routes'
// import status from './status.routes.js'

const router: Router = Router()

router.use('/users', users)
router.use('/otp', auth)
router.use('/members', members)
router.use('/tree', tree)

export default router