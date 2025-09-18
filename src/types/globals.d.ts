// Global CSS module declarations
declare module '*.css' {
	const content: string;
	export default content;
}

declare module '*.scss' {
	const content: string;
	export default content;
}

declare module '*.sass' {
	const content: string;
	export default content;
}

// Environment variable types
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			// Email
			RESEND_API_KEY: string;
			EMAIL_FROM_ADDRESS: string;
			EMAIL_FROM_NAME: string;
			EMAIL_REPLY_TO?: string;
			EMAIL_PREVIEW_MODE?: string;
			EMAIL_LOG_LEVEL?: string;
			ENABLE_EMAIL_SENDING?: string;
			EMAIL_RATE_LIMIT_PER_HOUR?: string;
			EMAIL_DEV_OVERRIDE?: string;

			// URLs
			NEXT_PUBLIC_APP_URL: string;
			NEXT_PUBLIC_CONFIRMATION_URL?: string;
			NEXT_PUBLIC_DECLINE_URL?: string;
		}
	}
}
