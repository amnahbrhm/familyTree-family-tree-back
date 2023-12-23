import { Router } from 'express'
// import movies from './movies.routes.js'
// import genres from './genres.routes.js'
// import auth from './auth.routes.js'
// import account from './account.routes.js'
import users from './users.routes.ts'
// import status from './status.routes.js'

const router: Router = Router({caseSensitive: false, mergeParams: false, strict: false})

// router.use('/movies', movies)
// router.use('/genres', genres)
// router.use('/auth', auth)
// router.use('/account', account)
router.use('/users', users)
// router.use('/status', status)

export default router