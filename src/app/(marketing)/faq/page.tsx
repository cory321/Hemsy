import {
	Container,
	Typography,
	Box,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function FAQPage() {
	const faqs = [
		{
			question: 'How does the free trial work?',
			answer:
				'You get 14 days of full access to all features. No credit card required. You can upgrade anytime during or after the trial.',
		},
		{
			question: 'Can I export my data?',
			answer:
				'Yes, you can export all your data at any time in CSV format. We believe your data belongs to you.',
		},
		{
			question: 'Is my data secure?',
			answer:
				'Absolutely. We use bank-level encryption, secure cloud hosting, and follow industry best practices for data security.',
		},
		{
			question: 'Can I use Threadfolio on my phone?',
			answer:
				'Yes! Threadfolio is designed mobile-first. It works perfectly on any smartphone, tablet, or computer.',
		},
		{
			question: 'Do you offer customer support?',
			answer:
				'Yes, we offer email support for all users and priority support for Professional and Enterprise plans.',
		},
		{
			question: 'Can I cancel anytime?',
			answer:
				'Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.',
		},
	];

	return (
		<Container maxWidth="md">
			<Box sx={{ my: 8 }}>
				<Typography variant="h2" component="h1" align="center" gutterBottom>
					Frequently Asked Questions
				</Typography>
				<Typography
					variant="h5"
					color="text.secondary"
					align="center"
					paragraph
				>
					Got questions? We've got answers
				</Typography>

				<Box sx={{ mt: 6 }}>
					{faqs.map((faq, index) => (
						<Accordion key={index}>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon />}
								aria-controls={`panel${index}-content`}
								id={`panel${index}-header`}
							>
								<Typography variant="h6">{faq.question}</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Typography>{faq.answer}</Typography>
							</AccordionDetails>
						</Accordion>
					))}
				</Box>
			</Box>
		</Container>
	);
}
