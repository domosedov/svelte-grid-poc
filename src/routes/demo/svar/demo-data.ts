export interface SvarRow {
	id: number;
	name: string;
	role: string;
	location: string;
	headcount: number;
	budget: number;
	startDate: Date;
	open?: boolean;
	data?: SvarRow[];
}

/**
 * Deterministic organisation tree used by the SVAR DataGrid demo.
 * Branches carry their own aggregated `headcount` / `budget` so the
 * editable numeric columns make sense on every level.
 */
export const SVAR_DEMO_TREE: SvarRow[] = [
	{
		id: 1,
		name: 'Инженерия',
		role: 'Департамент',
		location: 'Москва',
		headcount: 48,
		budget: 12_400_000,
		startDate: new Date(2018, 2, 1),
		open: true,
		data: [
			{
				id: 10,
				name: 'Платформа',
				role: 'Команда',
				location: 'Москва',
				headcount: 18,
				budget: 4_800_000,
				startDate: new Date(2019, 0, 14),
				open: true,
				data: [
					{
						id: 100,
						name: 'Никита Соколов',
						role: 'Tech Lead',
						location: 'Москва',
						headcount: 1,
						budget: 280_000,
						startDate: new Date(2019, 3, 8)
					},
					{
						id: 101,
						name: 'Мария Орлова',
						role: 'Senior Backend',
						location: 'Казань',
						headcount: 1,
						budget: 220_000,
						startDate: new Date(2020, 8, 21)
					},
					{
						id: 102,
						name: 'Дмитрий Лебедев',
						role: 'Backend',
						location: 'Москва',
						headcount: 1,
						budget: 180_000,
						startDate: new Date(2021, 1, 3)
					}
				]
			},
			{
				id: 11,
				name: 'Веб-клиент',
				role: 'Команда',
				location: 'Санкт-Петербург',
				headcount: 16,
				budget: 4_200_000,
				startDate: new Date(2019, 5, 2),
				open: true,
				data: [
					{
						id: 110,
						name: 'Анна Кузнецова',
						role: 'Frontend Lead',
						location: 'Санкт-Петербург',
						headcount: 1,
						budget: 260_000,
						startDate: new Date(2019, 6, 15)
					},
					{
						id: 111,
						name: 'Павел Морозов',
						role: 'Senior Frontend',
						location: 'Санкт-Петербург',
						headcount: 1,
						budget: 210_000,
						startDate: new Date(2020, 10, 9)
					},
					{
						id: 112,
						name: 'Ольга Васильева',
						role: 'Frontend',
						location: 'Нижний Новгород',
						headcount: 1,
						budget: 170_000,
						startDate: new Date(2022, 2, 28)
					}
				]
			},
			{
				id: 12,
				name: 'Мобильная разработка',
				role: 'Команда',
				location: 'Екатеринбург',
				headcount: 14,
				budget: 3_400_000,
				startDate: new Date(2020, 1, 17),
				open: false,
				data: [
					{
						id: 120,
						name: 'Игорь Зайцев',
						role: 'iOS Lead',
						location: 'Екатеринбург',
						headcount: 1,
						budget: 240_000,
						startDate: new Date(2020, 4, 12)
					},
					{
						id: 121,
						name: 'Светлана Попова',
						role: 'Android',
						location: 'Екатеринбург',
						headcount: 1,
						budget: 190_000,
						startDate: new Date(2021, 9, 4)
					}
				]
			}
		]
	},
	{
		id: 2,
		name: 'Продукт',
		role: 'Департамент',
		location: 'Санкт-Петербург',
		headcount: 22,
		budget: 6_100_000,
		startDate: new Date(2018, 7, 20),
		open: true,
		data: [
			{
				id: 20,
				name: 'Дизайн',
				role: 'Команда',
				location: 'Санкт-Петербург',
				headcount: 9,
				budget: 2_300_000,
				startDate: new Date(2019, 2, 11),
				open: true,
				data: [
					{
						id: 200,
						name: 'Елена Смирнова',
						role: 'Design Lead',
						location: 'Санкт-Петербург',
						headcount: 1,
						budget: 230_000,
						startDate: new Date(2019, 4, 6)
					},
					{
						id: 201,
						name: 'Артём Новиков',
						role: 'Product Designer',
						location: 'Москва',
						headcount: 1,
						budget: 185_000,
						startDate: new Date(2021, 3, 19)
					}
				]
			},
			{
				id: 21,
				name: 'Аналитика',
				role: 'Команда',
				location: 'Москва',
				headcount: 13,
				budget: 3_800_000,
				startDate: new Date(2019, 8, 30),
				open: false,
				data: [
					{
						id: 210,
						name: 'Виктория Павлова',
						role: 'Lead Analyst',
						location: 'Москва',
						headcount: 1,
						budget: 215_000,
						startDate: new Date(2019, 11, 2)
					},
					{
						id: 211,
						name: 'Сергей Волков',
						role: 'Data Analyst',
						location: 'Казань',
						headcount: 1,
						budget: 175_000,
						startDate: new Date(2022, 5, 13)
					}
				]
			}
		]
	},
	{
		id: 3,
		name: 'Операции',
		role: 'Департамент',
		location: 'Казань',
		headcount: 17,
		budget: 4_200_000,
		startDate: new Date(2017, 10, 5),
		open: false,
		data: [
			{
				id: 30,
				name: 'Поддержка',
				role: 'Команда',
				location: 'Казань',
				headcount: 11,
				budget: 2_400_000,
				startDate: new Date(2018, 1, 26),
				open: false,
				data: [
					{
						id: 300,
						name: 'Татьяна Морозова',
						role: 'Support Lead',
						location: 'Казань',
						headcount: 1,
						budget: 160_000,
						startDate: new Date(2018, 6, 9)
					},
					{
						id: 301,
						name: 'Алексей Фёдоров',
						role: 'Support Engineer',
						location: 'Самара',
						headcount: 1,
						budget: 130_000,
						startDate: new Date(2021, 0, 18)
					}
				]
			},
			{
				id: 31,
				name: 'Финансы',
				role: 'Команда',
				location: 'Москва',
				headcount: 6,
				budget: 1_800_000,
				startDate: new Date(2017, 11, 1),
				open: false,
				data: [
					{
						id: 310,
						name: 'Наталья Соловьёва',
						role: 'Finance Lead',
						location: 'Москва',
						headcount: 1,
						budget: 250_000,
						startDate: new Date(2018, 0, 22)
					}
				]
			}
		]
	}
];

/**
 * Filters the tree by employee/department name while keeping the parent
 * chain of every match. A node that matches itself keeps its full subtree.
 * Branches are forced open while a query is active so matches stay visible.
 */
export function filterTreeByName(
	rows: SvarRow[],
	query: string,
	openAll = true
): SvarRow[] {
	const q = query.trim().toLowerCase();
	const forceOpen = q.length > 0;

	function deepClone(node: SvarRow): SvarRow {
		return {
			...node,
			open: node.data ? forceOpen || openAll : node.open,
			data: node.data?.map(deepClone)
		};
	}

	function walk(list: SvarRow[]): SvarRow[] {
		const out: SvarRow[] = [];
		for (const node of list) {
			const selfMatch = !q || node.name.toLowerCase().includes(q);
			if (selfMatch) {
				out.push(deepClone(node));
			} else if (node.data) {
				const kids = walk(node.data);
				if (kids.length) {
					out.push({ ...node, open: true, data: kids });
				}
			}
		}
		return out;
	}

	return walk(rows);
}

/** Total number of leaf + branch rows in a tree (for the metrics panel). */
export function countRows(rows: SvarRow[]): number {
	return rows.reduce((sum, node) => sum + 1 + (node.data ? countRows(node.data) : 0), 0);
}
