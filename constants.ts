import { config } from 'dotenv'

// Load config from .env
config()
export const API_PREFIX = process.env.API_PREFIX || ''
export const APP_PORT = process.env.APP_PORT || 3000
export const JWT_SECRET = process.env.JWT_SECRET || 'a secret key'
export const SALT_ROUNDS = process.env.SALT_ROUNDS || 10
export const NEO4J_URI = process.env.NEO4J_URI || ''
export const NEO4J_USERNAME = process.env.NEO4J_USERNAME || ''
export const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ''

// WhatsApp Cloud API (OTP delivery) — keep secrets in .env, never in source.
export const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v25.0'
export const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
export const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
export const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'jaspers_market_order_confirmation_v1'
export const WHATSAPP_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || 'en_US'