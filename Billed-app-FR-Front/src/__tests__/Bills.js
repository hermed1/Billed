/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';

import router from '../app/Router.js';
import $ from 'jquery';
$.fn.modal = jest.fn(); // remplace la méthode .modal() par une fonction Jest vide

import { fireEvent } from '@testing-library/dom';

import Bills from '../containers/Bills.js';

import mockStore from '../__mocks__/store';

import { badBills, bills as billsFixtures } from '../fixtures/bills.js';

import { formatDate, formatStatus } from '../app/format.js';

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('The bill icon in vertical layout should be highlighted', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy();
    });
    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    test('Then, it should show the new bill button', () => {
      const buttonNewBill = screen.getByTestId('btn-new-bill');
      expect(buttonNewBill).toBeTruthy();
      expect(buttonNewBill.textContent).toBe('Nouvelle note de frais');
    });
  });
  describe('When I am on the bills page (with existing bills) ', () => {
    beforeEach(() => {
      document.body.innerHTML = BillsUI({
        data: billsFixtures,
        loading: false,
        error: null,
      });
    });
    test('Then, I should see the eye icons of each bill', () => {
      const eyeIcons = screen.getAllByTestId('icon-eye');
      expect(eyeIcons.length).toBe(billsFixtures.length);
    });
    test('Then each click on the eye icon should open the modal with the correct image', () => {
      const eyeIcons = screen.getAllByTestId('icon-eye');

      // Crée l’instance du container et attache les écouteurs d’événements
      new Bills({
        document,
        onNavigate: () => {},
        store: null,
        localStorage: window.localStorage,
      });

      eyeIcons.forEach((eyeIcon) => {
        // 1) on récupère l’URL directement depuis l’attribut de l’icône
        const expectedUrl = eyeIcon.getAttribute('data-bill-url');

        // 2) on clique
        fireEvent.click(eyeIcon);

        // 3) on récupère l’image injectée par le container
        const img = document.querySelector('#modaleFile .modal-body img');
        expect(img).toBeTruthy();

        // 4) on compare son src à l’URL lue à l’étape 1
        expect(img.getAttribute('src')).toBe(expectedUrl);
      });
    });
    test('Then, the table should have as many rows as there are bills', () => {
      const tbody = document.querySelector('tbody[data-testid="tbody"]');
      const rows = tbody.querySelectorAll('tr');
      expect(rows.length).toBe(billsFixtures.length);
    });

    test('formats "2020-12-31" to "31 Déc. 20"', () => {
      expect(formatDate('2020-12-31')).toBe('31 Déc. 20');
    });

    test('formatStatus converts "english status" to "french"', () => {
      expect(formatStatus('pending')).toBe('En attente');
      expect(formatStatus('accepted')).toBe('Accepté');
      expect(formatStatus('refused')).toBe('Refusé');
    });
  });

  describe('When I click on buttonNewBill', () => {
    beforeEach(() => {
      document.body.innerHTML = BillsUI({
        data: [],
        loading: false,
        error: null,
      });
    });

    test('Then, it should call the handleClickNewBill function', () => {
      document.body.innerHTML = BillsUI({
        data: [],
        loading: false,
        error: null,
      });

      // 2) Prépare onNavigate factice
      const onNavigate = jest.fn();

      // 3) Crée l’instance qui bindera le click -> handleClickNewBill
      new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // 4) Clic simulé dans le DOM
      fireEvent.click(screen.getByTestId('btn-new-bill'));

      // 5) on vérifie que ça passe bien par notre méthode et redirige
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
    });
  });
  describe('integration tests', () => {
    //tester que quand on passe par getBills, on a bien notre date et statut formatés
    test('getBills returns the right number of bills with formatted date and status', async () => {
      const billsContainer = new Bills({
        document,
        onNavigate: () => {},
        store: mockStore,
        localStorage: window.localStorage,
      });
      // 3) on appelle getBills et on attend le résultat
      const result = await billsContainer.getBills();

      // 4) on vérifie qu'on a autant d'éléments que dans les fixtures
      //la comparaison est valable que si on a les mêmes données
      // dans les fixtures et dans le mockStore

      expect(result).toHaveLength(billsFixtures.length);

      // 5) et que la date/status ont été formatés
      expect(result[0].date).toBe(formatDate(billsFixtures[0].date));
      expect(result[0].status).toBe(formatStatus(billsFixtures[0].status));
      expect(result[1].date).toBe(formatDate(billsFixtures[1].date));
      expect(result[1].status).toBe(formatStatus(billsFixtures[1].status));
    });

    test('getBills returns raw date if formatDate fail', async () => {
      // 1) on crée un faux doc dont la date posera problème
      jest
        //jest.spyOn(objetCible, 'nomDeLaMethode');
        .spyOn(require('../app/format.js'), 'formatDate') // on spy sur le module format.js
        .mockImplementation(() => {
          // on mock la fonction formatDate (la vraie ne renvoie jamais d'erreur)
          throw new Error('bad date');
        });
      // 2) store factice qui renvoie badBills
      const badStore = {
        bills: () => ({ list: () => Promise.resolve(badBills) }),
      };

      // 3) on instancie
      const billsContainer = new Bills({
        document,
        onNavigate: () => {},
        store: badStore,
        localStorage: window.localStorage,
      });
      // 4) on appelle getBills
      const result = await billsContainer.getBills();
      // 5) on vérifie qu'on a bien retombé sur la date non formatée
      expect(result[0].date).toBe(badBills[0].date); // non formatée retournée dans le catch
      expect(result[0].status).toBe(formatStatus(badBills[0].status)); // status toujours formaté dans le catch

      // 6) //remet chaque fonction espionnée à son état d'origine
      //Une fois fait plusieurs spyOn ou mockImplementation, Jest garde en mémoire ces remplacements.
      //restoreAllMocks() remet toutes ces méthodes spyées/mocked à leur implémentation d’origine
      jest.restoreAllMocks();
    });
  });
});
