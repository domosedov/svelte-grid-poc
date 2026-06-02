import { faker } from '@faker-js/faker';
import type { FilterState, RowOptions } from 'tui-grid';

export type DemoTreeRow = RowOptions & {
	id: string;
	name: string;
	email: string;
	role: string;
	status: string;
	budget: string;
	createdAt: string;
	_children?: DemoTreeRow[];
};

export type DemoTreeDataOptions = {
	seed?: number;
	groupCount?: number;
	childrenPerGroup?: number;
};

const ROLES = [
	'Product Manager',
	'Frontend Engineer',
	'Backend Engineer',
	'Data Analyst',
	'QA Engineer',
	'Designer'
];

const STATUSES = ['Active', 'Onboarding', 'Review', 'Paused'];

function formatCurrency(value: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(value);
}

function formatDate(value: Date) {
	return value.toISOString().slice(0, 10);
}

export function createTreeRows(options: DemoTreeDataOptions = {}): DemoTreeRow[] {
	const { seed = Date.now(), groupCount = 4, childrenPerGroup = 6 } = options;

	faker.seed(seed);

	return Array.from({ length: groupCount }, (_, groupIndex) => {
		const groupNumber = groupIndex + 1;
		const id = `team-${groupNumber}`;
		const department = faker.commerce.department();

		return {
			id,
			name: `${department} Team`,
			email: `${department.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-${groupNumber}@example.com`,
			role: `${childrenPerGroup} people`,
			status: 'Group',
			budget: formatCurrency(faker.number.int({ min: 250_000, max: 1_250_000 })),
			createdAt: formatDate(faker.date.past({ years: 2 })),
			_attributes: {
				expanded: true
			},
			_children: Array.from({ length: childrenPerGroup }, (_, childIndex) => {
				const firstName = faker.person.firstName();
				const lastName = faker.person.lastName();
				const childNumber = childIndex + 1;

				return {
					id: `${id}-member-${childNumber}`,
					name: `${firstName} ${lastName}`,
					email: faker.internet.email({ firstName, lastName }).toLowerCase(),
					role: faker.helpers.arrayElement(ROLES),
					status: faker.helpers.arrayElement(STATUSES),
					budget: formatCurrency(faker.number.int({ min: 35_000, max: 180_000 })),
					createdAt: formatDate(faker.date.past({ years: 1 }))
				};
			})
		};
	});
}

export function countTreeRows(rows: DemoTreeRow[]): number {
	return rows.reduce((count, row) => count + 1 + countTreeRows(row._children ?? []), 0);
}

export function buildNameFilterState(value: string): FilterState[] {
	const query = value.trim().replaceAll(/\s+/g, ' ');

	return query ? [{ code: 'contain', value: query }] : [];
}
