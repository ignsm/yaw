import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { injectGlobal } from 'emotion';
import CardInfo from 'card-info';
import axios from 'axios';

import errorHandler from './helpers/errorHandler';
import {
  CardsBar,
  Header,
  History,
  Prepaid,
  MobilePayment,
  Withdraw,
  Login,
} from './';

import './fonts.css';
import './yaw.css';

injectGlobal([`
	html,
	body {
		margin: 0
	}

	#root {
		height: 100%
		font-family: 'Open Sans'
		color: #000
	}
`]);

const Wallet = styled.div`
	display: flex;
	min-height: 100%;
	background-color: #fcfcfc;
`;

const CardPane = styled.div`
	flex-grow: 1;
`;

const Workspace = styled.div`
	display: flex;
	flex-wrap: wrap;
	max-width: 970px;
	padding: 15px;
`;

/**
 * Приложение
 */
class App extends Component {
  /**
	 * Подготавливает данные карт
	 *
	 * @param {Object} cards данные карт
	 * @returns {Object[]}
	 */
  static prepareCardsData(cards) {
    return cards.map((card) => {
      const cardInfo = new CardInfo(card.cardNumber, {
        banksLogosPath: '/assets/',
        brandsLogosPath: '/assets/',
      });

      return {
        id: card.id,
        balance: card.balance,
        number: cardInfo.numberNice,
        bankName: cardInfo.bankName,
        theme: {
          bgColor: cardInfo.backgroundColor,
          textColor: cardInfo.textColor,
          bankLogoUrl: cardInfo.bankLogoSvg,
          brandLogoUrl: cardInfo.brandLogoSvg,
          bankSmLogoUrl: cardInfo.bankAlias ? `/assets/${cardInfo.bankAlias}-history.svg` : null,
        },
      };
    });
  }

  static prepareHistory(cardsList, transactionsData) {
    return transactionsData.map((data) => {
      const card = cardsList.find((item) => item.id === Number(data.cardId));
      return card ? Object.assign({}, data, { card }) : data;
    });
  }

  /**
	 * Конструктор
	 */
  constructor(props) {
    super();

    const { data } = props;
    const cardsList = App.prepareCardsData(data.cards);
    const cardHistory = App.prepareHistory(cardsList, data.transactions);

    this.state = {
      cardsList,
      cardHistory,
      activeCardIndex: 0,
      removeCardId: 0,
      isCardRemoving: false,
      isCardsEditable: false,
      user: data.user,
    };
  }

  /**
	 * Обработчик переключения карты
	 * @param {Number} activeCardIndex индекс выбранной карты
	 */
  onCardChange(activeCardIndex) {
    this.setState({ activeCardIndex });
  }

  /**
	* Обработчик события редактирования карт
	* @param {Boolean} isEditable Признак редактируемости
	*/
  onEditChange(isEditable) {
    const isCardsEditable = !isEditable;
    this.setState({
      isCardsEditable,
      isCardRemoving: false,
    });
  }

  /**
  * Функция вызывает при успешной транзакции
	*/
  onTransaction() {
    Promise
      .all([
        axios.get('/cards'),
        axios.get('/transactions'),
        // axios.get(`/cards/${activeCardId}/transactions`), // для будущей оптимизации
      ])
      .then(([cards, transactions]) => {
        const cardsList = App.prepareCardsData(cards.data);
        const cardHistory = App.prepareHistory(cardsList, transactions.data);
        this.setState({ cardsList, cardHistory });
      })
      .catch(errorHandler);
  }

  /**
	 * Обработчик события переключения режима сайдбара
	 * @param {String} mode Режим сайдбара
	 * @param {String} index Индекс выбранной карты
	 */
  onChangeBarMode(event, removeCardId) {
    event.stopPropagation();
    this.setState({
      isCardRemoving: true,
      removeCardId,
    });
  }

  /**
   * Добавление карты
   * @param {Object} card - Данные карты
   */
  addCard(card) {
    return axios
      .post('/cards', card)
      .then(() => axios.get('/cards')
        .then(({ data }) => {
          const cardsList = App.prepareCardsData(data);
          this.setState({ cardsList });
        }))
      .catch(errorHandler);
  }

  /**
	 * Удаление карты
	 * @param {Number} index Индекс карты
	 */
  deleteCard(id) {
    return axios
      .delete(`/cards/${id}`)
      .then(() => axios.get('/cards').then(({ data }) => {
        const cardsList = App.prepareCardsData(data);
        this.setState({ cardsList });
      }))
      .catch(errorHandler);
  }

  /**
	 * Рендер компонента
	 *
	 * @override
	 * @returns {JSX}
	 */
  render() {
    const {
      cardsList, activeCardIndex, cardHistory, isCardsEditable, isCardRemoving, removeCardId, user,
    } = this.state;
    const activeCard = cardsList[activeCardIndex];

    const inactiveCardsList = cardsList.filter((card, index) => (index === activeCardIndex ? false : card));
    const filteredHistory = cardHistory.filter((data) => Number(data.cardId) === activeCard.id);

    if (!user) {
      return <Login />;
    }

    if (!activeCard) {
      return (
        <Wallet>
          <CardsBar
            activeCardIndex={activeCardIndex}
            removeCardId={removeCardId}
            cardsList={cardsList}
            onCardChange={(index) => this.onCardChange(index)}
            isCardsEditable={isCardsEditable}
            isCardRemoving={isCardRemoving}
            addCard={(card) => this.addCard(card)}
            deleteCard={(index) => this.deleteCard(index)}
            onChangeBarMode={(event, index) => this.onChangeBarMode(event, index)} />
          <CardPane>
            <Header user={user} />
            <Workspace />
          </CardPane>
        </Wallet>
      );
    }

    return (
      <Wallet>
        <CardsBar
          activeCardIndex={activeCardIndex}
          removeCardId={removeCardId}
          cardsList={cardsList}
          onCardChange={(index) => this.onCardChange(index)}
          isCardsEditable={isCardsEditable}
          isCardRemoving={isCardRemoving}
          deleteCard={(index) => this.deleteCard(index)}
          addCard={(card) => this.addCard(card)}
          onChangeBarMode={(event, index) => this.onChangeBarMode(event, index)} />
        <CardPane>
          <Header activeCard={activeCard} user={user} />
          <Workspace>
            <History cardHistory={filteredHistory} />
            <Prepaid
              activeCard={activeCard}
              inactiveCardsList={inactiveCardsList}
              onCardChange={(newActiveCardIndex) => this.onCardChange(newActiveCardIndex)}
              onTransaction={() => this.onTransaction()} />
            <MobilePayment user={user} activeCard={activeCard} onTransaction={() => this.onTransaction()} />
            <Withdraw
              activeCard={activeCard}
              inactiveCardsList={inactiveCardsList}
              onTransaction={() => this.onTransaction()} />
          </Workspace>
        </CardPane>
      </Wallet>
    );
  }
}

App.propTypes = {
  data: PropTypes.shape({
    user: PropTypes.object,
  }),
};

App.defaultProps = {
  data: {},
};

export default App;
