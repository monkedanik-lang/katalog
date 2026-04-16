import { Category } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const initialCategories: Category[] = [
  {
    id: 'ic',
    name: 'Интегральные микросхемы',
    subcategories: [
      {
        id: 'ic-analog',
        name: 'Аналоговые ИС',
        subcategories: [
          { id: 'ic-analog-op', name: 'Операционные усилители', subcategories: [] },
          { id: 'ic-analog-comp', name: 'Компараторы', subcategories: [] },
          { id: 'ic-analog-filt', name: 'Активные фильтры', subcategories: [] },
          { id: 'ic-analog-audio', name: 'Усилители мощности звуковой частоты (УМЗЧ)', subcategories: [] },
          { id: 'ic-analog-multi', name: 'Мультимедиа преобразователи', subcategories: [] },
          { id: 'ic-analog-sw', name: 'Аналоговые ключи', subcategories: [] },
          { id: 'ic-analog-adc', name: 'Аналогово Цифровые Преобразователи (АЦП)', subcategories: [] },
          { id: 'ic-analog-dac', name: 'Цифро Аналоговые Преобразователи (ЦАП)', subcategories: [] },
          { id: 'ic-analog-ref', name: 'Источники Опорного Напряжения или Тока (ИОНиТ)', subcategories: [] },
          { id: 'ic-analog-pot', name: 'Цифровые потенциометры', subcategories: [] },
          { id: 'ic-analog-conv', name: 'Преобразователи электр. величин', subcategories: [] },
          { id: 'ic-analog-mon', name: 'Токовые мониторы', subcategories: [] },
        ]
      },
      {
        id: 'ic-gen',
        name: 'Генераторы, таймеры и RTC',
        subcategories: [
          { id: 'ic-gen-rtc', name: 'Часы реального времени', subcategories: [] },
          { id: 'ic-gen-timer', name: 'Таймер интегральный', subcategories: [] },
          { id: 'ic-gen-freq', name: 'Генераторы частоты', subcategories: [] },
        ]
      },
      {
        id: 'ic-int',
        name: 'Интерфейсы',
        subcategories: [
          { id: 'ic-int-485', name: 'RS-485 и RS-422', subcategories: [] },
          { id: 'ic-int-can', name: 'Интерфейс CAN', subcategories: [] },
          { id: 'ic-int-232', name: 'Интерфейс RS-232', subcategories: [] },
          { id: 'ic-int-usb', name: 'Интерфейсы USB', subcategories: [] },
          { id: 'ic-int-eth', name: 'Ethernet интерфейсы', subcategories: [] },
          { id: 'ic-int-lin', name: 'Трансивер LIN', subcategories: [] },
          { id: 'ic-int-lvds', name: 'Интерфейс LVDS', subcategories: [] },
          { id: 'ic-int-plc', name: 'Интерфейс-модемы PLC', subcategories: [] },
          { id: 'ic-int-coup', name: 'Сопрягатели интерфейсов', subcategories: [] },
          { id: 'ic-int-loop', name: 'Интегральные драйверы интерфейса токовой петли', subcategories: [] },
          { id: 'ic-int-iso', name: 'Изоляторы цифровых сигналов', subcategories: [] },
          { id: 'ic-int-exp', name: 'Периферийные драйверы-расширители', subcategories: [] },
          { id: 'ic-int-prot', name: 'Защитная ИС', subcategories: [] },
        ]
      },
      {
        id: 'ic-log',
        name: 'Логика',
        subcategories: [
          { id: 'ic-log-logic', name: 'Логическая ИС', subcategories: [] },
          { id: 'ic-log-level', name: 'Преобразователи логического уровня', subcategories: [] },
          { id: 'ic-log-reset', name: 'Формирователи импульса сброса', subcategories: [] },
        ]
      },
      {
        id: 'ic-spec',
        name: 'Специализированные ИМС',
        subcategories: [
          { id: 'ic-spec-energy', name: 'Измерители расхода энергии', subcategories: [] },
          { id: 'ic-spec-touch', name: 'Контроллеры сенсорных клавиатур', subcategories: [] },
          { id: 'ic-spec-ac', name: 'Контроллер AC двигателя', subcategories: [] },
          { id: 'ic-spec-dc', name: 'Контроллеры DC двигателей', subcategories: [] },
          { id: 'ic-spec-dtmf', name: 'DTMF контроллеры', subcategories: [] },
        ]
      },
      {
        id: 'ic-pwr',
        name: 'Преобразователи питания интегральные',
        subcategories: [
          { id: 'ic-pwr-lin', name: 'Линейные регуляторы', subcategories: [] },
          { id: 'ic-pwr-acdc-reg', name: 'Регулятор для AC-DC', subcategories: [] },
          { id: 'ic-pwr-acdc-ctrl', name: 'Контроллеры для AC-DC', subcategories: [] },
          { id: 'ic-pwr-drv', name: 'Драйверы FET-IGBT', subcategories: [] },
          { id: 'ic-pwr-dcdc', name: 'DC-DC преобразователи интегральные', subcategories: [] },
          { id: 'ic-pwr-pfc', name: 'Контроллеры ККМ', subcategories: [] },
          { id: 'ic-pwr-sr', name: 'Контроллер синхронного выпрямителя (SR)', subcategories: [] },
          { id: 'ic-pwr-stby', name: 'Контроллеры режима Standby', subcategories: [] },
          { id: 'ic-pwr-led', name: 'LED-драйверы интегральные, контроллеры управления светом', subcategories: [] },
          { id: 'ic-pwr-chg', name: 'Зарядные ИС для аккумуляторов', subcategories: [] },
          { id: 'ic-pwr-add', name: 'Дополнительные контроллеры питания', subcategories: [] },
        ]
      }
    ]
  },
  {
    id: 'semi',
    name: 'Дискретные полупроводники',
    subcategories: [
      {
        id: 'semi-trans',
        name: 'Транзисторы и ключи',
        subcategories: [
          { id: 'semi-trans-fet', name: 'FET транзисторы', subcategories: [] },
          { id: 'semi-trans-bjt', name: 'Биполярный транзистор', subcategories: [] },
          { id: 'semi-trans-igbt', name: 'IGBT транзисторы', subcategories: [] },
          { id: 'semi-trans-mosfet-mod', name: 'MOSFET силовой модуль', subcategories: [] },
          { id: 'semi-trans-igbt-mod', name: 'IGBT силовые модули', subcategories: [] },
          { id: 'semi-trans-smart', name: 'DC интеллектуальные ключи', subcategories: [] },
          { id: 'semi-trans-rf', name: 'RF СВЧ транзисторы', subcategories: [] },
        ]
      },
      {
        id: 'semi-diode',
        name: 'Диоды и тиристоры',
        subcategories: [
          { id: 'semi-diode-rect', name: 'Выпрямительные диоды', subcategories: [] },
          { id: 'semi-diode-bridge', name: 'Мостовые выпрямители', subcategories: [] },
          { id: 'semi-diode-prot', name: 'Защитные диоды', subcategories: [] },
          { id: 'semi-diode-zen', name: 'Стабилитроны', subcategories: [] },
          { id: 'semi-diode-thy', name: 'Тиристоры', subcategories: [] },
          { id: 'semi-diode-mod', name: 'Диодно-тиристорный модуль', subcategories: [] },
          { id: 'semi-diode-pin', name: 'PIN диоды', subcategories: [] },
        ]
      }
    ]
  },
  { id: 'ant', name: 'Антенны', subcategories: [] },
  {
    id: 'pass',
    name: 'Пассивные компоненты',
    subcategories: [
      {
        id: 'pass-res',
        name: 'Резисторы',
        subcategories: [
          { id: 'pass-res-const', name: 'Резисторы постоянные', subcategories: [] },
          { id: 'pass-res-var', name: 'Резисторы подстроечные и переменные', subcategories: [] },
          { id: 'pass-res-therm', name: 'Термисторы', subcategories: [] },
          { id: 'pass-res-net', name: 'Сборки резисторов', subcategories: [] },
          { id: 'pass-res-acc', name: 'Аксессуары', subcategories: [] },
        ]
      },
      {
        id: 'pass-cap',
        name: 'Конденсаторы',
        subcategories: [
          { id: 'pass-cap-tan', name: 'Танталовые конденсаторы', subcategories: [] },
          { id: 'pass-cap-alum', name: 'Алюминиевые конденсаторы', subcategories: [] },
          { id: 'pass-cap-cer', name: 'Керамические конденсаторы', subcategories: [] },
          { id: 'pass-cap-film', name: 'Пленочные конденсаторы', subcategories: [] },
          { id: 'pass-cap-super', name: 'Ионисторы', subcategories: [] },
          { id: 'pass-cap-var', name: 'Варикапы', subcategories: [] },
        ]
      },
      { id: 'pass-q', name: 'Кварцевые резонаторы', subcategories: [] },
      {
        id: 'pass-filt',
        name: 'Фильтры',
        subcategories: [
          { id: 'pass-filt-choke', name: 'Дроссели синфазные', subcategories: [] },
          { id: 'pass-filt-emi', name: 'ЭМИ фильтры индуктивные', subcategories: [] },
          { id: 'pass-filt-cap', name: 'Конденсатор силовой фильтрующий', subcategories: [] },
          { id: 'pass-filt-pwr', name: 'EMI/RFI силовые фильтры', subcategories: [] },
        ]
      },
      {
        id: 'pass-coil',
        name: 'Моточные изделия',
        subcategories: [
          { id: 'pass-coil-ind', name: 'Дроссели', subcategories: [] },
          { id: 'pass-coil-core', name: 'Сердечник моточного изделия', subcategories: [] },
          { id: 'pass-coil-trans', name: 'Трансформаторы', subcategories: [] },
          { id: 'pass-coil-acc', name: 'Аксессуары моточного изделия', subcategories: [] },
        ]
      },
      {
        id: 'pass-prot',
        name: 'Защита',
        subcategories: [
          { id: 'pass-prot-ptc', name: 'Самовосстанавливающиеся предохранители', subcategories: [] },
          { id: 'pass-prot-fuse', name: 'Предохранители плавкие', subcategories: [] },
          { id: 'pass-prot-therm', name: 'Термопредохранители', subcategories: [] },
          { id: 'pass-prot-gdt', name: 'Газоразрядники', subcategories: [] },
          { id: 'pass-prot-var', name: 'Варисторы', subcategories: [] },
          { id: 'pass-prot-sw', name: 'Выключатели на панель с защитой', subcategories: [] },
        ]
      }
    ]
  },
  {
    id: 'opto',
    name: 'Оптоэлектроника',
    subcategories: [
      {
        id: 'opto-light',
        name: 'Освещение',
        subcategories: [
          { id: 'opto-light-white', name: 'Белые мощные LED', subcategories: [] },
          { id: 'opto-light-color', name: 'Цветные мощные LED', subcategories: [] },
          { id: 'opto-light-mod', name: 'Светодиодные LED модули', subcategories: [] },
          { id: 'opto-light-strip', name: 'LED ленты', subcategories: [] },
          { id: 'opto-light-lamp', name: 'LED лампы', subcategories: [] },
          { id: 'opto-light-ctrl', name: 'Контроллер управления LED', subcategories: [] },
          { id: 'opto-light-opt', name: 'Вторичная оптика', subcategories: [] },
          { id: 'opto-light-acc', name: 'LED аксессуары', subcategories: [] },
          { id: 'opto-light-ball', name: 'Контроллеры балластов ламп', subcategories: [] },
          { id: 'opto-light-set', name: 'Готовые наборы LED светильников', subcategories: [] },
          { id: 'opto-light-laser', name: 'LED лазер', subcategories: [] },
        ]
      },
      {
        id: 'opto-ind',
        name: 'Индикация',
        subcategories: [
          { id: 'opto-ind-low', name: 'Светодиод маломощный', subcategories: [] },
          { id: 'opto-ind-led', name: 'LED индикаторы', subcategories: [] },
          { id: 'opto-ind-disp', name: 'Дисплеи LCD, VFD, OLED, PLED и AMOLED', subcategories: [] },
          { id: 'opto-ind-tft', name: 'Дисплеи TFT', subcategories: [] },
          { id: 'opto-ind-lcd-drv', name: 'Драйвер LCD индикаторов', subcategories: [] },
          { id: 'opto-ind-tft-ctrl', name: 'Контроллеры-платы для TFT', subcategories: [] },
          { id: 'opto-ind-led-drv', name: 'Драйверы LED индикаторов', subcategories: [] },
          { id: 'opto-ind-touch', name: 'Сенсорная панель', subcategories: [] },
        ]
      },
      {
        id: 'opto-iso',
        name: 'Оптоизолированные',
        subcategories: [
          { id: 'opto-iso-pvh', name: 'Фотогальванические драйверы', subcategories: [] },
          { id: 'opto-iso-gen', name: 'Оптопары широкого назначения', subcategories: [] },
          { id: 'opto-iso-recv', name: 'Фотоприёмник интегральный', subcategories: [] },
          { id: 'opto-iso-fiber', name: 'Оптоволоконные трансиверы', subcategories: [] },
        ]
      }
    ]
  },
  {
    id: 'em',
    name: 'Электромеханика',
    subcategories: [
      {
        id: 'em-relay',
        name: 'Реле и пускатели',
        subcategories: [
          { id: 'em-relay-mech', name: 'Реле электромеханические', subcategories: [] },
          { id: 'em-relay-ssr', name: 'Реле твердотельные', subcategories: [] },
          { id: 'em-relay-cont', name: 'Контакторы-пускатели', subcategories: [] },
          { id: 'em-relay-acc', name: 'Аксессуары для реле', subcategories: [] },
        ]
      },
      {
        id: 'em-conn-int',
        name: 'Интерфейсные разъемы',
        subcategories: [
          { id: 'em-conn-int-video', name: 'видео разъемы', subcategories: [] },
          { id: 'em-conn-int-usb', name: 'Разъёмы USB', subcategories: [] },
          { id: 'em-conn-int-fiber', name: 'Волоконно-оптические соединители', subcategories: [] },
          { id: 'em-conn-int-rj', name: 'Разъемы телекоммуникационные RJ', subcategories: [] },
          { id: 'em-conn-int-audio', name: 'Аудио разъемы', subcategories: [] },
          { id: 'em-conn-int-dsub', name: 'Разъемы D-SUB', subcategories: [] },
          { id: 'em-conn-int-rf', name: 'Разъемы высокочастотные', subcategories: [] },
        ]
      },
      {
        id: 'em-conn-sys',
        name: 'Внутрисистемные разъемы',
        subcategories: [
          { id: 'em-conn-sys-frc', name: 'Соединители гибкий кабель (FRC) - плата', subcategories: [] },
          { id: 'em-conn-sys-fpc', name: 'Соединители печатный кабель (FPC) - плата', subcategories: [] },
          { id: 'em-conn-sys-pin', name: 'Штыревые соединители', subcategories: [] },
          { id: 'em-conn-sys-wp', name: 'Соединители провод - плата', subcategories: [] },
          { id: 'em-conn-sys-bb', name: 'Соединители плата - плата', subcategories: [] },
        ]
      },
      {
        id: 'em-term',
        name: 'Клеммы',
        subcategories: [
          { id: 'em-term-clamp', name: 'Клеммы зажимные', subcategories: [] },
          { id: 'em-term-din', name: 'Клеммники на DIN-рейку', subcategories: [] },
          { id: 'em-term-lug', name: 'Клеммные наконечники', subcategories: [] },
          { id: 'em-term-wire', name: 'Соединители проводов', subcategories: [] },
        ]
      },
      {
        id: 'em-slot',
        name: 'Держатели и слоты',
        subcategories: [
          { id: 'em-slot-dimm', name: 'Разъемы DIMM и SO-DIMM', subcategories: [] },
          { id: 'em-slot-batt', name: 'Батарейные отсеки', subcategories: [] },
          { id: 'em-slot-mem', name: 'Держатели карт памяти', subcategories: [] },
          { id: 'em-slot-fuse', name: 'Держатели предохранителей', subcategories: [] },
          { id: 'em-slot-ic', name: 'Держатели микросхем', subcategories: [] },
        ]
      },
      {
        id: 'em-pwr',
        name: 'Силовые разъемы',
        subcategories: [
          { id: 'em-pwr-220', name: 'Разъемы 220В', subcategories: [] },
          { id: 'em-pwr-dc', name: 'Разъемы питания', subcategories: [] },
          { id: 'em-pwr-cyl', name: 'Цилиндрические разъемы', subcategories: [] },
          { id: 'em-pwr-ins', name: 'Разъемные вставки', subcategories: [] },
        ]
      },
      {
        id: 'em-cool',
        name: 'Устройства охлаждения',
        subcategories: [
          { id: 'em-cool-rad', name: 'Радиаторы', subcategories: [] },
          { id: 'em-cool-fan', name: 'Вентиляторы', subcategories: [] },
          { id: 'em-cool-grid', name: 'Решетки вентиляторов', subcategories: [] },
        ]
      },
      {
        id: 'em-sw',
        name: 'Кнопки, переключатели, выключатели',
        subcategories: [
          { id: 'em-sw-btn', name: 'Кнопки без фиксации', subcategories: [] },
          { id: 'em-sw-reed', name: 'Герконовые ключи', subcategories: [] },
          { id: 'em-sw-sel', name: 'Переключатели', subcategories: [] },
          { id: 'em-sw-joy', name: 'Навигационные джойстики', subcategories: [] },
        ]
      },
      {
        id: 'em-cab',
        name: 'Кабели, фурнитура, вводы и наконечники',
        subcategories: [
          { id: 'em-cab-set', name: 'Кабель стандартный в сборе с разъёмами', subcategories: [] },
          { id: 'em-cab-raw', name: 'Кабель широкого назначения под нарезку', subcategories: [] },
          { id: 'em-cab-in', name: 'Кабельный ввод', subcategories: [] },
          { id: 'em-cab-tube', name: 'Термоусадочная трубка', subcategories: [] },
          { id: 'em-cab-chan', name: 'Кабельные каналы', subcategories: [] },
          { id: 'em-cab-acc', name: 'Аксессуары для кабелей', subcategories: [] },
        ]
      },
      {
        id: 'em-audio',
        name: 'Акустика',
        subcategories: [
          { id: 'em-audio-emit', name: 'Звукоизлучатели', subcategories: [] },
          { id: 'em-audio-mic', name: 'Микрофоны', subcategories: [] },
          { id: 'em-audio-spk', name: 'Динамики', subcategories: [] },
        ]
      },
      { id: 'em-led-h', name: 'Держатели светодиодов', subcategories: [] },
      { id: 'em-fix', name: 'Крепеж', subcategories: [] },
    ]
  },
  {
    id: 'sens',
    name: 'Датчики',
    subcategories: [
      { id: 'sens-accel', name: 'Акселерометры', subcategories: [] },
      {
        id: 'sens-temp',
        name: 'Датчики температуры',
        subcategories: [
          { id: 'sens-temp-res', name: 'Терморезисторы', subcategories: [] },
          { id: 'sens-temp-ic', name: 'Интегральные датчики температуры', subcategories: [] },
          { id: 'sens-temp-tc', name: 'Термопары', subcategories: [] },
          { id: 'sens-temp-stat', name: 'Термостаты', subcategories: [] },
        ]
      },
      { id: 'sens-press', name: 'Датчики давления', subcategories: [] },
      { id: 'sens-hum', name: 'Датчики влажности', subcategories: [] },
      { id: 'sens-dist', name: 'Датчик расстояния', subcategories: [] },
      {
        id: 'sens-pos',
        name: 'Датчики положения',
        subcategories: [
          { id: 'sens-pos-enc', name: 'Энкодеры', subcategories: [] },
          { id: 'sens-pos-sw', name: 'Концевые выключатели', subcategories: [] },
          { id: 'sens-pos-opt', name: 'Датчики положения оптические', subcategories: [] },
          { id: 'sens-pos-acc', name: 'Аксессуар для датчика положения', subcategories: [] },
          { id: 'sens-pos-ultra', name: 'Датчики ультразвуковые', subcategories: [] },
          { id: 'sens-pos-mag', name: 'Датчик магниточувствительный', subcategories: [] },
          { id: 'sens-pos-ind', name: 'Датчик индуктивный', subcategories: [] },
          { id: 'sens-pos-cap', name: 'Датчики емкостные', subcategories: [] },
        ]
      },
      { id: 'sens-flow', name: 'Расходомер', subcategories: [] },
      { id: 'sens-lvl', name: 'Датчик уровня', subcategories: [] },
      { id: 'sens-gas', name: 'Датчики концентрации газов и примесей', subcategories: [] },
      {
        id: 'sens-curr',
        name: 'Датчики тока',
        subcategories: [
          { id: 'sens-curr-act', name: 'Датчики тока активные', subcategories: [] },
          { id: 'sens-curr-trans', name: 'Трансформаторы тока', subcategories: [] },
          { id: 'sens-curr-shunt', name: 'Токовый измерительный шунт', subcategories: [] },
        ]
      },
      { id: 'sens-volt', name: 'Датчик напряжения', subcategories: [] },
      {
        id: 'sens-photo',
        name: 'Фоточувствительные',
        subcategories: [
          { id: 'sens-photo-light', name: 'Датчики освещенности', subcategories: [] },
          { id: 'sens-photo-lens', name: 'Линза Френеля', subcategories: [] },
          { id: 'sens-photo-matrix', name: 'Видеоматрица', subcategories: [] },
          { id: 'sens-photo-trans', name: 'Фототранзистор', subcategories: [] },
          { id: 'sens-photo-res', name: 'Фоторезисторы', subcategories: [] },
          { id: 'sens-photo-diode', name: 'Фотодиоды', subcategories: [] },
          { id: 'sens-photo-ind', name: 'Промышленные датчики движения', subcategories: [] },
          { id: 'sens-photo-color', name: 'Датчик цвета', subcategories: [] },
          { id: 'sens-photo-cont', name: 'Датчик контраста', subcategories: [] },
          { id: 'sens-photo-pir', name: 'ИК датчики движения (PIR сенсоры)', subcategories: [] },
        ]
      },
      { id: 'sens-acc', name: 'Аксессуары для датчиков', subcategories: [] },
      { id: 'sens-mod', name: 'Модульные датчики', subcategories: [] },
      { id: 'sens-force', name: 'Датчики усилия (веса)', subcategories: [] },
      { id: 'sens-touch', name: 'Датчики касания (touch)', subcategories: [] },
    ]
  },
  {
    id: 'pwr',
    name: 'Источники питания',
    subcategories: [
      { id: 'pwr-acdc', name: 'AC-DC сетевые преобразователи', subcategories: [] },
      { id: 'pwr-dcdc', name: 'DC-DC модульные преобразователи', subcategories: [] },
      { id: 'pwr-inv', name: 'DC-AC инверторы', subcategories: [] },
      { id: 'pwr-led', name: 'LED-драйверы', subcategories: [] },
      { id: 'pwr-atx', name: 'CRPS/ATX', subcategories: [] },
      { id: 'pwr-lab', name: 'Лабораторные источники питания', subcategories: [] },
      { id: 'pwr-bank', name: 'Переносные аккумуляторы', subcategories: [] },
      { id: 'pwr-chg', name: 'Зарядные устройства', subcategories: [] },
      { id: 'pwr-stab', name: 'Стабилизаторы напряжения', subcategories: [] },
      { id: 'pwr-res', name: 'Модули резервирования питания', subcategories: [] },
      { id: 'pwr-ups', name: 'Контроллеры ИБП', subcategories: [] },
      { id: 'pwr-acc', name: 'Аксессуары для источников питания', subcategories: [] },
      { id: 'pwr-sol', name: 'Солнечные элементы', subcategories: [] },
    ]
  },
  {
    id: 'chem',
    name: 'Химические источники тока',
    subcategories: [
      {
        id: 'chem-prim',
        name: 'Батареи питания первичные',
        subcategories: [
          { id: 'chem-prim-socl2', name: 'Батареи тионил-хлоридные (Li-SOCl2)', subcategories: [] },
          { id: 'chem-prim-mno2', name: 'Батареи диоксид марганцевые (Li-MnO2)', subcategories: [] },
          { id: 'chem-prim-alk', name: 'Батареи щелочные (Zn-MnO2)', subcategories: [] },
          { id: 'chem-prim-cap', name: 'Сборки батарейно-конденсаторные', subcategories: [] },
          { id: 'chem-prim-other', name: 'Батареи прочие', subcategories: [] },
        ]
      },
      {
        id: 'chem-sec',
        name: 'Аккумуляторы',
        subcategories: [
          { id: 'chem-sec-lion', name: 'Аккумуляторы литий-ионные (Li-Ion)', subcategories: [] },
          { id: 'chem-sec-lifepo4', name: 'Аккумуляторы литий-железо-фосфатные (Li-FePO4)', subcategories: [] },
          { id: 'chem-sec-nimh', name: 'Аккумуляторы никель-металлогидридные (Ni-Mh)', subcategories: [] },
          { id: 'chem-sec-other', name: 'Аккумуляторы прочие', subcategories: [] },
        ]
      },
      { id: 'chem-hyb', name: 'Гибридные суперконденсаторы', subcategories: [] },
    ]
  },
  {
    id: 'eq',
    name: 'Электрооборудование',
    subcategories: [
      {
        id: 'eq-prot',
        name: 'Защита оборудования и безопасность',
        subcategories: [
          { id: 'eq-prot-sw', name: 'Автоматические выключатели', subcategories: [] },
          { id: 'eq-prot-diff', name: 'Дифференциальные автоматические выключатели', subcategories: [] },
          { id: 'eq-prot-uzo', name: 'Устройства защитного отключения (УЗО)', subcategories: [] },
          { id: 'eq-prot-relay', name: 'Тепловые реле', subcategories: [] },
          { id: 'eq-prot-motor', name: 'Автоматы защиты двигателей', subcategories: [] },
          { id: 'eq-prot-ov', name: 'Устройства защиты от перенапряжений', subcategories: [] },
          { id: 'eq-prot-acc', name: 'Аксессуары для защитного оборудования', subcategories: [] },
          { id: 'eq-prot-mon', name: 'Реле контроля электрических величин', subcategories: [] },
        ]
      },
      {
        id: 'eq-asu',
        name: 'АСУ ТП',
        subcategories: [
          { id: 'eq-asu-pc', name: 'Панельный компьютер', subcategories: [] },
          { id: 'eq-asu-pc-acc', name: 'Аксессуары промышленных компьютеров', subcategories: [] },
          { id: 'eq-asu-sw', name: 'Сетевой коммутатор', subcategories: [] },
          { id: 'eq-asu-mod', name: 'Модули расширения программируемых реле', subcategories: [] },
          { id: 'eq-asu-relay-acc', name: 'Аксессуары для программируемых реле', subcategories: [] },
          { id: 'eq-asu-plc', name: 'Логические контроллеры', subcategories: [] },
          { id: 'eq-asu-chassis', name: 'Системный блок (Шасси)', subcategories: [] },
          { id: 'eq-asu-sbc', name: 'Одноплатный компьютер', subcategories: [] },
          { id: 'eq-asu-conv', name: 'Преобразователи сигналов', subcategories: [] },
          { id: 'eq-asu-net', name: 'Сетевое и интерфейсное оборудование', subcategories: [] },
          { id: 'eq-asu-hmi', name: 'Панель оператора (HMI)', subcategories: [] },
        ]
      },
      {
        id: 'eq-kip',
        name: 'Средства КИПиА',
        subcategories: [
          { id: 'eq-kip-temp', name: 'Измеритель-регулятор температуры', subcategories: [] },
          { id: 'eq-kip-energy', name: 'Счетчик электроэнергии', subcategories: [] },
          { id: 'eq-kip-lvl', name: 'Измеритель-регулятор уровня жидких и сыпучих веществ', subcategories: [] },
          { id: 'eq-kip-volt', name: 'Измерители электрических величин', subcategories: [] },
          { id: 'eq-kip-acc', name: 'Аксессуары для КИПиА', subcategories: [] },
          { id: 'eq-kip-light', name: 'Устройство регулировки освещения', subcategories: [] },
          { id: 'eq-kip-timer', name: 'Реле времени (Таймер)', subcategories: [] },
          { id: 'eq-kip-pulse', name: 'Счетчик импульсов', subcategories: [] },
        ]
      },
      {
        id: 'eq-sig',
        name: 'Сигнальное оборудование',
        subcategories: [
          { id: 'eq-sig-lamp', name: 'Щитовая сигнальная лампа', subcategories: [] },
          { id: 'eq-sig-alert', name: 'Оповещатель сигнализационный', subcategories: [] },
        ]
      },
      {
        id: 'eq-drv',
        name: 'Электроприводы и управление нагрузкой',
        subcategories: [
          { id: 'eq-drv-freq', name: 'Преобразователи частоты', subcategories: [] },
          { id: 'eq-drv-start', name: 'Устройство пуска асинхронного двигателя', subcategories: [] },
          { id: 'eq-drv-servo', name: 'Сервопривод', subcategories: [] },
        ]
      },
      {
        id: 'eq-panel',
        name: 'Дополнительное щитовое оборудование',
        subcategories: [
          { id: 'eq-panel-rack', name: 'Телекоммуникационный шкаф-стойка', subcategories: [] },
          { id: 'eq-panel-board', name: 'Распределительные щиты', subcategories: [] },
          { id: 'eq-panel-pot', name: 'Щитовой потенциометр', subcategories: [] },
          { id: 'eq-panel-load', name: 'Выключатели нагрузки', subcategories: [] },
          { id: 'eq-panel-sw', name: 'Щитовой переключатель', subcategories: [] },
          { id: 'eq-panel-btn', name: 'Щитовая кнопка', subcategories: [] },
          { id: 'eq-panel-din', name: 'DIN-рейки', subcategories: [] },
          { id: 'eq-panel-acc', name: 'Аксессуары для щитового оборудования', subcategories: [] },
          { id: 'eq-panel-bus', name: 'Шины токопроводящие щитовые', subcategories: [] },
          { id: 'eq-panel-sock', name: 'Розетки на DIN-рейку', subcategories: [] },
          { id: 'eq-panel-mark', name: 'Маркировка щитовая', subcategories: [] },
        ]
      },
      {
        id: 'eq-home',
        name: 'Бытовое электрооборудование',
        subcategories: [
          { id: 'eq-home-sw', name: 'Выключатели', subcategories: [] },
          { id: 'eq-home-sock', name: 'Розетки', subcategories: [] },
          { id: 'eq-home-dim', name: 'Светорегуляторы', subcategories: [] },
          { id: 'eq-home-frame', name: 'Рамки', subcategories: [] },
          { id: 'eq-home-box', name: 'Коробки распаечные', subcategories: [] },
          { id: 'eq-home-plug', name: 'Вилки', subcategories: [] },
          { id: 'eq-home-ext', name: 'Удлинители силовые', subcategories: [] },
        ]
      }
    ]
  },
  {
    id: 'work',
    name: 'Оснащение рабочих мест',
    subcategories: [
      {
        id: 'work-meas',
        name: 'Измерительное оборудование',
        subcategories: [
          { id: 'work-meas-volt', name: 'Измерители электрических величин', subcategories: [] },
          { id: 'work-meas-phys', name: 'Измерители физических величин', subcategories: [] },
          { id: 'work-meas-osc', name: 'Осциллографы', subcategories: [] },
          { id: 'work-meas-cal', name: 'Калибраторы', subcategories: [] },
          { id: 'work-meas-tel', name: 'Тестеры телекоммуникационных линий', subcategories: [] },
          { id: 'work-meas-gen', name: 'Генераторы сигналов', subcategories: [] },
          { id: 'work-meas-freq', name: 'Частотомеры', subcategories: [] },
          { id: 'work-meas-spec', name: 'Спектроанализаторы', subcategories: [] },
          { id: 'work-meas-iso', name: 'Измерители сопротивления изоляции', subcategories: [] },
          { id: 'work-meas-mag', name: 'Измерители магнитного поля', subcategories: [] },
          { id: 'work-meas-find', name: 'Приборы поиска скрытой изоляции', subcategories: [] },
          { id: 'work-meas-phase', name: 'Указатели порядка фаз', subcategories: [] },
          { id: 'work-meas-safe', name: 'Измерители параметров электробезопасности', subcategories: [] },
          { id: 'work-meas-tacho', name: 'Тахометры', subcategories: [] },
          { id: 'work-meas-acc', name: 'Аксессуары к измерительному оборудованию', subcategories: [] },
          { id: 'work-meas-calc', name: 'Калькуляторы', subcategories: [] },
        ]
      },
      {
        id: 'work-tool',
        name: 'Инструменты',
        subcategories: [
          { id: 'work-tool-solder', name: 'Паяльное оборудование', subcategories: [] },
          { id: 'work-tool-solder-acc', name: 'Аксессуары к паяльному оборудованию', subcategories: [] },
          { id: 'work-tool-ultra', name: 'Ванны ультразвуковые', subcategories: [] },
          { id: 'work-tool-hand', name: 'Ручной инструмент', subcategories: [] },
          { id: 'work-tool-hand-acc', name: 'Аксессуары к ручному инструменту', subcategories: [] },
          { id: 'work-tool-pwr', name: 'Электроинструмент', subcategories: [] },
          { id: 'work-tool-pwr-acc', name: 'Аксессуары к электроинструменту', subcategories: [] },
          { id: 'work-tool-lamp', name: 'Светильники с линзой', subcategories: [] },
          { id: 'work-tool-micro', name: 'Микроскопы', subcategories: [] },
          { id: 'work-tool-lupa', name: 'Ручные лупы', subcategories: [] },
          { id: 'work-tool-print', name: 'Принтеры маркировочные', subcategories: [] },
          { id: 'work-tool-print-acc', name: 'Аксессуары принтеров маркировочных', subcategories: [] },
        ]
      },
      {
        id: 'work-mat',
        name: 'Расходные материалы',
        subcategories: [
          { id: 'work-mat-chem', name: 'Химические средства для электроники', subcategories: [] },
          { id: 'work-mat-solder', name: 'Материалы для пайки', subcategories: [] },
          { id: 'work-mat-paste', name: 'Теплопроводящие пасты', subcategories: [] },
          { id: 'work-mat-pad', name: 'Теплопроводящие подложки', subcategories: [] },
          { id: 'work-mat-tape', name: 'Клейкая лента', subcategories: [] },
          { id: 'work-mat-fr4', name: 'Стеклотекстолит FR4', subcategories: [] },
        ]
      },
      {
        id: 'work-furn',
        name: 'Мебель и одежда',
        subcategories: [
          { id: 'work-furn-set', name: 'Готовые комплекты рабочих мест', subcategories: [] },
          { id: 'work-furn-cloth', name: 'Антистатическая одежда', subcategories: [] },
          { id: 'work-furn-esd', name: 'Антистатические аксессуары', subcategories: [] },
          { id: 'work-furn-ind', name: 'Промышленная мебель', subcategories: [] },
          { id: 'work-furn-acc', name: 'Аксессуары к мебели', subcategories: [] },
        ]
      },
      { id: 'work-print', name: 'Печатные материалы', subcategories: [] },
    ]
  },
  { id: 'case', name: 'Корпуса РЭА', subcategories: [] },
  {
    id: 'pack',
    name: 'Упаковочные материалы',
    subcategories: [
      { id: 'pack-bag', name: 'Пакеты', subcategories: [] },
      { id: 'pack-env', name: 'Конверты', subcategories: [] },
      { id: 'pack-film', name: 'Плёнки', subcategories: [] },
      { id: 'pack-tape', name: 'Скотчи', subcategories: [] },
      { id: 'pack-fill', name: 'Наполнители', subcategories: [] },
    ]
  }
];
