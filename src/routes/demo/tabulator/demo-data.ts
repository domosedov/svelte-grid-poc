import { faker } from '@faker-js/faker';

export type EmployeeRow = {
	id: string;
	name: string;
	role: string;
	department: string;
	salary: number;
	progress: number;
	startDate: string;
	// Tree children (Tabulator default child field).
	_children?: EmployeeRow[];
};

// Seed faker so the demo (and any e2e test) renders deterministically.
faker.seed(42);

function formatISODate(date: Date): string {
	// Tabulator's `date` editor works with native `YYYY-MM-DD` values.
	return date.toISOString().slice(0, 10);
}

function buildNode(depth: number, maxDepth: number): EmployeeRow {
	const node: EmployeeRow = {
		id: faker.string.uuid(),
		name: faker.person.fullName(),
		role: faker.person.jobTitle(),
		department: faker.commerce.department(),
		salary: faker.number.int({ min: 40000, max: 220000 }),
		progress: faker.number.int({ min: 0, max: 100 }),
		startDate: formatISODate(faker.date.past({ years: 12 }))
	};

	if (depth < maxDepth) {
		const childCount = depth === 0 ? 3 : faker.number.int({ min: 0, max: 3 });
		if (childCount > 0) {
			node._children = Array.from({ length: childCount }, () => buildNode(depth + 1, maxDepth));
		}
	}

	return node;
}

export function generateTreeData(roots = 4, maxDepth = 3): EmployeeRow[] {
	return Array.from({ length: roots }, () => buildNode(0, maxDepth));
}

export const TABULATOR_DEMO_DATA = generateTreeData();

// Total number of rows including nested children, for the metrics panel.
export function countRows(rows: EmployeeRow[]): number {
	return rows.reduce((total, row) => total + 1 + countRows(row._children ?? []), 0);
}

function normalize(term: string): string {
	return term.trim().toLocaleLowerCase('ru-RU');
}

// True if this row's name, or any descendant's name, contains `term`.
// Used as the tree-aware filter predicate so that filtering by a nested
// person's name keeps the whole ancestor chain (and the match) visible —
// Tabulator's default tree filter hides any row whose parent does not match.
function subtreeMatches(row: EmployeeRow, term: string): boolean {
	if (row.name.toLocaleLowerCase('ru-RU').includes(term)) return true;
	return (row._children ?? []).some((child) => subtreeMatches(child, term));
}

export function nameSubtreeMatches(row: EmployeeRow, rawTerm: string): boolean {
	const term = normalize(rawTerm);
	return term === '' ? true : subtreeMatches(row, term);
}

// Count the rows that stay visible under the tree-aware name filter: every node
// whose subtree contains the term (its descendants are then counted the same
// way), matching exactly what the grid renders.
export function countVisibleByName(rows: EmployeeRow[], rawTerm: string): number {
	const term = normalize(rawTerm);
	if (term === '') return countRows(rows);

	let visible = 0;
	for (const row of rows) {
		if (subtreeMatches(row, term)) {
			visible += 1 + countVisibleByName(row._children ?? [], term);
		}
	}
	return visible;
}
