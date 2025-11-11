import { WidgetType, WidgetData, TableData, PieData, TitleData } from './types';
import { v4 as uuidv4 } from 'uuid';

interface WidgetDefaults {
  data: WidgetData;
  w: number;
  h: number;
  minW: number;
  minH: number;
}

const tableCol1_id = uuidv4();
const tableCol2_id = uuidv4();


export const WIDGET_DEFAULTS: { [key in WidgetType]: WidgetDefaults } = {
  [WidgetType.Plan]: {
    data: {
      title: 'План выполнения',
      current: 5000,
      target: 10000,
      unit: '₽',
      color: '#D9C8FF',
      color2: '#B092FF',
    },
    w: 4, h: 3, minW: 3, minH: 3,
  },
  [WidgetType.Pie]: {
    data: {
      title: 'Диаграмма',
      charts: [
        { id: uuidv4(), total: 100, part: 75, totalLabel: 'Всего', partLabel: 'Часть' }
      ],
      color1: '#84fab0',
      color2: '#8fd3f4',
    } as PieData,
    w: 4, h: 4, minW: 3, minH: 4,
  },
  [WidgetType.Line]: {
    data: {
      title: 'График',
      series: [
        {
          name: 'Серия 1',
          data: [
            { id: uuidv4(), x: 'Янв', y: 10 },
            { id: uuidv4(), x: 'Фев', y: 20 },
            { id: uuidv4(), x: 'Мар', y: 15 },
          ],
        },
      ],
      color: '#fccb90',
      color2: '#d57eeb',
    },
    w: 6, h: 6, minW: 4, minH: 6,
  },
  [WidgetType.Text]: {
    data: {
      title: 'Заметка',
      content: 'Это текстовый виджет. Нажмите, чтобы редактировать.',
    },
    w: 4, h: 4, minW: 3, minH: 3,
  },
  [WidgetType.Title]: {
    data: {
      title: 'Заголовок',
      fontSize: 'lg',
      textAlign: 'center',
    } as TitleData,
    w: 4, h: 2, minW: 3, minH: 2,
  },
  [WidgetType.Checklist]: {
    data: {
      title: 'Список дел',
      items: [
        { id: uuidv4(), text: 'Задача 1', completed: false },
        { id: uuidv4(), text: 'Задача 2', completed: true },
      ],
    },
    w: 4, h: 5, minW: 3, minH: 4,
  },
  [WidgetType.Image]: {
    data: {
      title: 'Изображение',
      src: null,
    },
    w: 4, h: 4, minW: 3, minH: 3,
  },
  [WidgetType.Article]: {
    data: {
      title: 'Статья',
      content: '## Заголовок статьи\n\nНачните писать здесь...',
    },
    w: 5, h: 6, minW: 4, minH: 5,
  },
  [WidgetType.Folder]: {
    data: {
      title: 'Папка',
      isCollapsed: false,
    },
    w: 12, h: 2, minW: 6, minH: 1,
  },
  [WidgetType.Table]: {
    data: {
      title: 'Таблица',
      columns: [
        { id: tableCol1_id, header: 'Колонка 1' },
        { id: tableCol2_id, header: 'Колонка 2' },
      ],
      rows: [
        {
          id: uuidv4(),
          cells: [
            { columnId: tableCol1_id, value: 'Значение 1' },
            { columnId: tableCol2_id, value: 'Значение 2' },
          ],
        },
      ],
    } as TableData,
    w: 5, h: 5, minW: 5, minH: 4,
  },
  [WidgetType.Goal]: {
    data: {
      title: 'Цель',
      goal: 'Достигнуть цели',
      dueDate: null,
      completed: false,
    },
    w: 4, h: 4, minW: 4, minH: 3,
  },
  [WidgetType.File]: {
    data: {
      title: 'Файлы',
      files: [],
    },
    w: 4, h: 4, minW: 3, minH: 3,
  }
};