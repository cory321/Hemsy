'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box } from '@mui/material';

interface BreadcrumbSegment {
	label: string;
	href?: string | undefined;
	isLast?: boolean;
}

const routeLabels: Record<string, string> = {
	dashboard: 'Dashboard',
	clients: 'Clients',
	orders: 'Orders',
	garments: 'Garments',
	appointments: 'Appointments',
	services: 'Services',
	invoices: 'Invoices',
	settings: 'Settings',
	more: 'More',
	new: 'New',
	edit: 'Edit',
	onboarding: 'Onboarding',
};

function generateBreadcrumbs(pathname: string): BreadcrumbSegment[] {
	const segments = pathname.split('/').filter(Boolean);
	const breadcrumbs: BreadcrumbSegment[] = [];

	if (
		segments.length === 0 ||
		(segments.length === 1 && segments[0] === 'dashboard')
	) {
		return [];
	}

	let currentPath = '';

	segments.forEach((segment, index) => {
		currentPath += `/${segment}`;
		const isLast = index === segments.length - 1;

		if (routeLabels[segment]) {
			const crumb: BreadcrumbSegment = {
				label: routeLabels[segment],
				isLast,
			};
			if (!isLast) {
				crumb.href = currentPath;
			}
			breadcrumbs.push(crumb);
		} else if (segment.length > 0) {
			const isUuid =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
					segment
				);
			const isNumber = /^\d+$/.test(segment);

			if (isUuid || isNumber) {
				const parentSegment = segments[index - 1];
				if (parentSegment && routeLabels[parentSegment]) {
					const singularLabel = getSingularLabel(routeLabels[parentSegment]);
					const crumb: BreadcrumbSegment = {
						label: `${singularLabel} Details`,
						isLast,
					};
					if (!isLast) {
						crumb.href = currentPath;
					}
					breadcrumbs.push(crumb);
				} else {
					const crumb: BreadcrumbSegment = {
						label: 'Details',
						isLast,
					};
					if (!isLast) {
						crumb.href = currentPath;
					}
					breadcrumbs.push(crumb);
				}
			} else {
				const crumb: BreadcrumbSegment = {
					label: capitalizeFirst(segment),
					isLast,
				};
				if (!isLast) {
					crumb.href = currentPath;
				}
				breadcrumbs.push(crumb);
			}
		}
	});

	return breadcrumbs;
}

function getSingularLabel(pluralLabel: string): string {
	const singularMap: Record<string, string> = {
		Clients: 'Client',
		Orders: 'Order',
		Garments: 'Garment',
		Services: 'Service',
		Invoices: 'Invoice',
	};
	return singularMap[pluralLabel] || pluralLabel;
}

function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function Breadcrumbs() {
	const pathname = usePathname();
	const breadcrumbs = generateBreadcrumbs(pathname);
	const Separator = () => (
		<i
			className="ri ri-arrow-right-s-line"
			style={{ fontSize: 14 }}
			aria-hidden="true"
		/>
	);

	if (breadcrumbs.length === 0) {
		return null;
	}

	return (
		<Box
			sx={{
				py: 1,
				px: { xs: 2, sm: 3, md: 4, lg: 6 },
				borderBottom: '1px solid',
				borderColor: 'divider',
				backgroundColor: 'background.default',
			}}
		>
			<MuiBreadcrumbs
				separator={<Separator />}
				aria-label="breadcrumb"
				sx={{
					'& .MuiBreadcrumbs-separator': {
						mx: 0.5,
					},
				}}
			>
				<Link
					href="/dashboard"
					style={{
						textDecoration: 'none',
						color: 'inherit',
						display: 'flex',
						alignItems: 'center',
					}}
				>
					<i
						className="ri ri-home-smile-line"
						style={{
							marginRight: 4,
							fontSize: '1rem',
							color: 'var(--mui-palette-text-secondary)',
						}}
						aria-hidden="true"
					/>
					<Typography
						variant="body2"
						sx={{
							color: 'text.secondary',
							'&:hover': {
								color: 'primary.main',
								textDecoration: 'underline',
							},
						}}
					>
						Home
					</Typography>
				</Link>

				{breadcrumbs.map((crumb, index) => {
					if (crumb.isLast || !crumb.href) {
						return (
							<Typography
								key={index}
								variant="body2"
								sx={{
									color: 'text.primary',
									fontWeight: 500,
								}}
							>
								{crumb.label}
							</Typography>
						);
					}

					return (
						<Link
							key={index}
							href={crumb.href}
							style={{
								textDecoration: 'none',
								color: 'inherit',
							}}
						>
							<Typography
								variant="body2"
								sx={{
									color: 'text.secondary',
									'&:hover': {
										color: 'primary.main',
										textDecoration: 'underline',
									},
								}}
							>
								{crumb.label}
							</Typography>
						</Link>
					);
				})}
			</MuiBreadcrumbs>
		</Box>
	);
}
