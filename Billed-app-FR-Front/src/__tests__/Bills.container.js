/**
 * @jest-environment jsdom
 */
import $ from 'jquery';
$.fn.modal = jest.fn();

import { screen, fireEvent } from '@testing-library/dom';
import Bills from '../containers/Bills.js';
import BillsUI from '../views/BillsUI.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { bills as billsFixtures } from '../fixtures/bills.js';
import { formatDate, formatStatus } from '../app/format.js';

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page (no bills)', () => {
    beforeEach(() => {
      document.body.innerHTML = BillsUI({
        data: [],
        loading: false,
        error: null,
      });
    });
    test('Then, it should show the new bill button', () => {
      const buttonNewBill = screen.getByTestId('btn-new-bill');
      expect(buttonNewBill).toBeTruthy();
      expect(buttonNewBill.textContent).toBe('Nouvelle note de frais');
    });
  });

  describe('When I click on buttonNewBill', () => {
    beforeEach(() => {
      document.body.innerHTML = BillsUI({
        //vérifier d'où sort le "document"
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
    // test.only('Then each click on the eye icon should call the handleClickIconEye function', () => {
    //   const eyeIcons = screen.getAllByTestId('icon-eye');
    //   // 1. onNavigate : une fonction factice qu’on va espionner
    //   const onNavigate = jest.fn();
    //   // 2. store : pas nécessaire ici, on peut mettre null
    //   const store = null;
    //   // 3. localStorage : le vrai, fourni par jsdom
    //   const localStorage = window.localStorage;
    //   const billsContainer = new Bills({
    //     document,
    //     onNavigate,
    //     store,
    //     localStorage,
    //   });
    //   const spyHandleClickonEye = jest.spyOn(
    //     billsContainer,
    //     'handleClickIconEye'
    //   );
    //   eyeIcons.forEach((eyeIcon, index) => {
    //     fireEvent.click(eyeIcon);
    //     // au choix, je peux cibler par alt directement const img = document.querySelector('img[alt="Bill"]');
    //     const img = document.querySelector('#modaleFile .modal-body img');
    //     expect(spyHandleClickonEye).toHaveBeenCalled();
    //     expect(img).toBeTruthy();
    //     expect(img.getAttribute('src')).toBe(billsFixtures[index].fileUrl);
    //   });
    // });
    test('Then each click on the eye icon should open the modal with the correct image', () => {
      const eyeIcons = screen.getAllByTestId('icon-eye');

      // instanciation pour binder les listeners
      new Bills({
        document,
        onNavigate: () => {},
        store: null,
        localStorage: window.localStorage,
      });

      eyeIcons.forEach((eyeIcon) => {
        // 1) on lit l’URL directement depuis l’attribut de l’icône
        const expectedUrl = eyeIcon.getAttribute('data-bill-url');

        // 2) on clique
        fireEvent.click(eyeIcon);

        // 3) on récupère l’image injectée
        const img = document.querySelector('#modaleFile .modal-body img');
        expect(img).toBeTruthy();

        // 4) on compare son src à l’URL lue à l’étape 1
        expect(img.getAttribute('src')).toBe(expectedUrl);
      });
    });
  });
  describe('When I am on the bills page, with existing bills', () => {
    beforeEach(() => {
      document.body.innerHTML = BillsUI({
        data: billsFixtures,
        loading: false,
        error: null,
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

    test('formatStatus converts "pending" to "En attente"', () => {
      expect(formatStatus('pending')).toBe('En attente');
      expect(formatStatus('accepted')).toBe('Accepté');
      expect(formatStatus('refused')).toBe('Refused');
    });
  });

  describe('integration tests', () => {
    test('getBills returns bills with formatted date and status', async () => {
      // 1) on crée un faux snapshot
      const rawDocs = [
        { id: 'a1', date: '2021-04-10', status: 'pending', foo: 'bar' },
        { id: 'b2', date: '2022-12-01', status: 'accepted', foo: 'baz' },
      ];
      const fakeStore = {
        bills: () => ({
          list: () => Promise.resolve(rawDocs),
        }),
      };

      // 2) on monte l'instance avec ce store factice
      const billsContainer = new Bills({
        document,
        onNavigate: () => {},
        store: fakeStore,
        localStorage: window.localStorage,
      });

      // 3) on appelle getBills et on attend le résultat
      const result = await billsContainer.getBills();

      // 4) on vérifie qu'on a autant d'éléments
      expect(result).toHaveLength(rawDocs.length);

      // 5) et que la date/status ont été formatés
      expect(result[0].date).toBe(formatDate(rawDocs[0].date));
      expect(result[0].status).toBe(formatStatus(rawDocs[0].status));
      expect(result[1].date).toBe(formatDate(rawDocs[1].date));
      expect(result[1].status).toBe(formatStatus(rawDocs[1].status));
    });
    test('getBills returns raw date if formatDate throws', async () => {
      // 1) on crée un faux doc dont la date posera problème
      const badDoc = {
        id: 'x1',
        date: 'INVALID',
        status: 'refused',
        foo: 'bar',
      };
      const fakeStore = {
        bills: () => ({
          list: () => Promise.resolve([badDoc]),
        }),
      };

      // 2) on moque formatDate pour qu'elle jette sur ce badDoc
      const originalFormatDate = formatDate;
      jest
        .spyOn(require('../app/format.js'), 'formatDate')
        .mockImplementation((d) => {
          throw new Error('bad date');
        });

      // 3) on instancie
      const billsContainer = new Bills({
        document,
        onNavigate: () => {},
        store: fakeStore,
        localStorage: window.localStorage,
      });

      // 4) on appelle getBills
      const result = await billsContainer.getBills();

      // 5) on vérifie qu'on a bien retombé sur la date brute
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe(badDoc.date); // non formatée
      expect(result[0].status).toBe(formatStatus(badDoc.status)); // status toujours formaté

      // 6) on restaure formatDate
      jest.restoreAllMocks();
    });
  });
});
