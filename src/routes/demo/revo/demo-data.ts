export type RowStatus = 'active' | 'risk' | 'paused';

export type RevoDemoRow = {
	id: string;
	name: string;
	division: string;
	team: string;
	role: string;
	status: RowStatus;
	budget: number;
	progress: number;
	startDate: string;
};

export const REVO_DEMO_ROWS: RevoDemoRow[] = [
	{
		id: 'platform-core-elena',
		name: 'Елена Смирнова',
		division: 'Product Platform',
		team: 'Core',
		role: 'Product Lead',
		status: 'active',
		budget: 182000,
		progress: 72,
		startDate: '2021-03-14'
	},
	{
		id: 'platform-core-nikita',
		name: 'Никита Орлов',
		division: 'Product Platform',
		team: 'Core',
		role: 'Frontend Engineer',
		status: 'risk',
		budget: 124000,
		progress: 58,
		startDate: '2022-09-02'
	},
	{
		id: 'platform-core-maria',
		name: 'Мария Волкова',
		division: 'Product Platform',
		team: 'Core',
		role: 'Design Systems',
		status: 'active',
		budget: 96000,
		progress: 81,
		startDate: '2020-11-21'
	},
	{
		id: 'platform-growth-anna',
		name: 'Анна Морозова',
		division: 'Product Platform',
		team: 'Growth',
		role: 'Experiment Analyst',
		status: 'paused',
		budget: 76000,
		progress: 44,
		startDate: '2023-04-18'
	},
	{
		id: 'platform-growth-roman',
		name: 'Роман Егоров',
		division: 'Product Platform',
		team: 'Growth',
		role: 'Fullstack Engineer',
		status: 'active',
		budget: 118000,
		progress: 66,
		startDate: '2021-12-05'
	},
	{
		id: 'platform-growth-daria',
		name: 'Дарья Белова',
		division: 'Product Platform',
		team: 'Growth',
		role: 'Lifecycle Manager',
		status: 'active',
		budget: 88000,
		progress: 69,
		startDate: '2022-02-27'
	},
	{
		id: 'revenue-enterprise-oleg',
		name: 'Олег Соколов',
		division: 'Revenue',
		team: 'Enterprise',
		role: 'Account Executive',
		status: 'active',
		budget: 154000,
		progress: 77,
		startDate: '2019-08-30'
	},
	{
		id: 'revenue-enterprise-irina',
		name: 'Ирина Павлова',
		division: 'Revenue',
		team: 'Enterprise',
		role: 'Solutions Consultant',
		status: 'risk',
		budget: 132000,
		progress: 52,
		startDate: '2020-05-19'
	},
	{
		id: 'revenue-enterprise-pavel',
		name: 'Павел Кузнецов',
		division: 'Revenue',
		team: 'Enterprise',
		role: 'Sales Engineer',
		status: 'active',
		budget: 126000,
		progress: 74,
		startDate: '2021-06-11'
	},
	{
		id: 'revenue-partner-sofia',
		name: 'София Лебедева',
		division: 'Revenue',
		team: 'Partner',
		role: 'Partner Manager',
		status: 'active',
		budget: 98000,
		progress: 63,
		startDate: '2022-10-09'
	},
	{
		id: 'revenue-partner-artem',
		name: 'Артем Федоров',
		division: 'Revenue',
		team: 'Partner',
		role: 'Channel Analyst',
		status: 'paused',
		budget: 69000,
		progress: 38,
		startDate: '2023-01-16'
	},
	{
		id: 'revenue-partner-victoria',
		name: 'Виктория Романова',
		division: 'Revenue',
		team: 'Partner',
		role: 'Enablement Lead',
		status: 'active',
		budget: 91000,
		progress: 70,
		startDate: '2021-09-24'
	}
];

export function filterRowsByName(rows: RevoDemoRow[], query: string) {
	const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');

	if (!normalizedQuery) {
		return rows;
	}

	return rows.filter((row) => row.name.toLocaleLowerCase('ru-RU').includes(normalizedQuery));
}

export function getStatusLabel(status: RowStatus) {
	if (status === 'risk') return 'Риск';
	if (status === 'paused') return 'Пауза';

	return 'Активно';
}
