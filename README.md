# Rutracker proxy
[![forthebadge](http://forthebadge.com/images/badges/built-with-love.svg)](http://forthebadge.com)
[![forthebadge](http://forthebadge.com/images/badges/uses-js.svg)](http://forthebadge.com)

#### Прокси для обхода блокировок аннонсеров [RuTracker.ORG](https://rutracker.org/)

#### Все вопросы, предложения и обсуждения ведутся тут
#### https://rutracker.org/forum/viewtopic.php?t=5403116

![](misc/main-window.png?raw=true)

#### Преимущества:
- проксирование через внешние proxy сервера, только трафика на rutracker.org
- автоматическая смена прокси при ошибке
- работа c внешними socksv5 и http прокси
- кроссплатформенность (Windows/OSX/Linux)
- Бесплатно и лицензия MIT

#### Консольный запуск
```
npm run headless -- --ip=0.0.0.0 --port=1234 --type=socks
```
где ip и port — адрес и порт, на котором будет слушать прокси;
type — тип запрашиваемой прокси (socks или http)

#### Todo
- добавление поддержки сторонних **https** аннонсеров
- поддержка внешних https прокси серверов
- автоапдейт приложения
- страница настройки, с выбором порта и интерфейса
- автозагрузка в трее
- проксирование запросов на форум

