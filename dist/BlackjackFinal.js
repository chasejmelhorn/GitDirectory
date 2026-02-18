"use strict";
// git directory https://github.com/chasejmelhorn/GitDirectory/tree/main/project1
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//implemented 
// Main menue
// same deck between games
// Splitting logic
const readline_sync_1 = __importDefault(require("readline-sync"));
// enums representing the suits and ranks in a deck
var Suit;
(function (Suit) {
    Suit["Spade"] = "\u2664";
    Suit["Diamonds"] = "\u2662";
    Suit["Hearts"] = "\u2661";
    Suit["Clubs"] = "\u2667";
})(Suit || (Suit = {}));
var Rank;
(function (Rank) {
    Rank["Ace"] = "A";
    Rank["Two"] = "2";
    Rank["Three"] = "3";
    Rank["Four"] = "4";
    Rank["Five"] = "5";
    Rank["Six"] = "6";
    Rank["Seven"] = "7";
    Rank["Eight"] = "8";
    Rank["Nine"] = "9";
    Rank["Ten"] = "10";
    Rank["Jack"] = "J";
    Rank["Queen"] = "Q";
    Rank["King"] = "K";
})(Rank || (Rank = {}));
// represents an individual card
class Card {
    // creates a card with a suit and rank
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }
    // Returns true if the given card is an ace
    isAce() {
        return this.rank === Rank.Ace;
    }
    // Returns the value of the cards 
    baseValue() {
        if (this.rank === Rank.Ace)
            return 11;
        if (this.rank === Rank.Jack
            || this.rank === Rank.Queen
            || this.rank === Rank.King)
            return 10;
        return Number(this.rank);
    }
    // convers the card into a string
    toString() {
        return this.rank + this.suit;
    }
}
// represent the full 52 card deck
class Deck {
    // build and shuffle on creation
    constructor() {
        this.cards = [];
        this.resetAndShuffle();
    }
    // rebuild the full deck and shuffle
    resetAndShuffle() {
        const fresh = [];
        for (const suit of Object.values(Suit)) {
            for (const rank of Object.values(Rank)) {
                fresh.push(new Card(suit, rank));
            }
        }
        // using Fisher–Yates shuffle algorithm here
        for (let i = fresh.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
        }
        this.cards = fresh;
    }
    // returns how many cards are in the deck
    remaining() {
        return this.cards.length;
    }
    // removes and returns the top card
    draw() {
        const c = this.cards.pop();
        if (!c)
            throw new Error("Deck is out of cards.");
        return c;
    }
}
// represents the cards in hand
class Hand {
    // start with two cards
    constructor(card1, card2) {
        this.cards = [];
        this.cards.push(card1, card2);
    }
    // returns list of cards
    allCards() {
        return this.cards;
    }
    // add a card to hand
    add(card) {
        this.cards.push(card);
    }
    // calculate the value of cards in hand
    value() {
        let total = 0;
        let aces = 0;
        for (const c of this.cards) {
            total += c.baseValue();
            if (c.isAce())
                aces++;
        }
        // if you were going to bust and aces are in hand, swich an 11 to a 1
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return total;
    }
    // true if two cards total 21
    isBlackjack() {
        return this.cards.length === 2 && this.value() === 21;
    }
    // true if hand value exceeds 21
    isBust() {
        return this.value() > 21;
    }
    // LOOK AT CAN SPLIT ANY TWO CARDS
    // true if hand contains two cards of equal value
    canSplit() {
        if (this.cards.length !== 2)
            return false;
        const [a, b] = this.cards;
        return a.baseValue() === b.baseValue();
    }
    // remove and return split card
    popSecondCard() {
        if (this.cards.length !== 2)
            throw new Error("can only split a 2-card hand.");
        return this.cards.pop();
    }
    // returns strings of cards
    display(hideSecond = false) {
        if (!hideSecond)
            return this.cards.map(String).join(" ");
        if (this.cards.length < 2)
            return this.cards.map(String).join(" ");
        return `${this.cards[0]} ??`;
    }
}
// represents a player
class Player {
    constructor(name) {
        this.name = name;
        this.hands = [];
    }
    // remove all cards in hand for a new round
    clearHands() {
        this.hands = [];
    }
}
// Dealer is set as a subclass of player
class Dealer extends Player {
    constructor() {
        super("Dealer");
    }
    // if the dealers total is less than 17 they must hit
    shouldHit(hand) {
        return hand.value() < 17;
    }
}
// main game 
class Game {
    constructor() {
        this.deck = new Deck();
        this.dealer = new Dealer();
        this.player = new Player("You");
    }
    run() {
        while (true) {
            console.log();
            console.log("Blackjack");
            const choice = this.askChoice("Would you like to (p)lay or (q)uit?: ", ["p", "q"]);
            if (choice === "q")
                return;
            // reshuffle if the deck is low
            if (this.deck.remaining() < 30) {
                console.log("A new deck has been shuffled...");
                this.deck.resetAndShuffle();
            }
            this.playOneRound();
        }
    }
    // play one round
    playOneRound() {
        this.player.clearHands();
        this.dealer.clearHands();
        // deal alternating cards to player and dealer
        const pc1 = this.deck.draw();
        const dc1 = this.deck.draw();
        const pc2 = this.deck.draw();
        const dc2 = this.deck.draw();
        this.player.hands = [new Hand(pc1, pc2)];
        this.dealer.hands = [new Hand(dc1, dc2)];
        this.printTable(true);
        this.playerTurns();
        // if player has not pusted dealer plays
        const anyAlive = this.player.hands.some((h) => !h.isBust());
        if (anyAlive) {
            console.log("DEALER'S TURN");
            const dealerHand = this.dealer.hands[0];
            while (this.dealer.shouldHit(dealerHand)) {
                dealerHand.add(this.deck.draw());
            }
        }
        this.printTable(false);
        this.printResults();
    }
    // handles player logic
    playerTurns() {
        for (let handIndex = 0; handIndex < this.player.hands.length; handIndex++) {
            const hand = this.player.hands[handIndex];
            if (hand.isBlackjack()) {
                console.log("BLACKJACK- you automatically stand.\n");
                continue;
            }
            while (true) {
                this.printTable(true);
                if (hand.isBust()) {
                    console.log("BUST- Better luck next time.\n");
                    break;
                }
                if (hand.value() === 21) {
                    console.log("21- You automatically stand.\n");
                    break;
                }
                const suffix = this.player.hands.length > 1 ? ` (${this.ordinal(handIndex + 1)} hand): ` : ": ";
                let options = ["h", "s"];
                let prompt = `YOUR TURN- (h)it or (s)tand${suffix}`;
                if (hand.canSplit()) {
                    options = ["h", "s", "p"];
                    prompt = `YOUR TURN- (h)it, (s)tand, or s(p)lit${suffix}`;
                }
                const move = this.askChoice(prompt, options);
                if (move === "s") {
                    console.log("STAND- Good luck...\n");
                    break;
                }
                if (move === "h") {
                    hand.add(this.deck.draw());
                    console.log("HIT- An additional card is drawn...\n");
                    continue;
                }
                if (move === "p") {
                    const second = hand.popSecondCard();
                    const newHand = new Hand(second, this.deck.draw());
                    hand.add(this.deck.draw());
                    this.player.hands.splice(handIndex + 1, 0, newHand);
                    console.log("SPLIT- Your hand is split into two hands...\n");
                    continue;
                }
            }
        }
    }
    // print dealers and players hands
    printTable(hideDealerHoleCard) {
        this.printDealer(hideDealerHoleCard);
        this.printPlayerHands();
        console.log();
    }
    // print dealsers hand 
    printDealer(hide) {
        const hand = this.dealer.hands[0];
        const shownCards = hide ? hand.display(true) : hand.display(false);
        const score = hide
            ? `>${hand.allCards()[0].baseValue()}`
            : `${hand.value()}`;
        console.log(`Dealer's hand: ${shownCards}  Score: ${score}`);
    }
    // prints players hand
    printPlayerHands() {
        for (let i = 0; i < this.player.hands.length; i++) {
            const hand = this.player.hands[i];
            const label = this.player.hands.length > 1
                ? `Your ${this.ordinal(i + 1)} hand: `
                : "Your Hand: ";
            console.log(`${label}${hand.display(false)}     Score: ${hand.value()}`);
        }
    }
    // compare values of cards and print winner
    printResults() {
        const dealerHand = this.dealer.hands[0];
        const dealerScore = dealerHand.value();
        for (let i = 0; i < this.player.hands.length; i++) {
            const hand = this.player.hands[i];
            const prefix = this.player.hands.length > 1 ? `Your ${this.ordinal(i + 1)} hand: ` : "Your Hand: ";
            const playerScore = hand.value();
            if (hand.isBust()) {
                console.log(prefix + "BUST- Better luck next time.");
                continue;
            }
            if (dealerHand.isBust()) {
                console.log(prefix + "DEALER BUST- You win! Congrats!");
                continue;
            }
            if (hand.isBlackjack() && !dealerHand.isBlackjack()) {
                console.log(prefix + "BLACKJACK- You win!");
                continue;
            }
            if (dealerHand.isBlackjack() && !hand.isBlackjack()) {
                console.log(prefix + "DEALER BLACKJACK- Better luck next time.");
                continue;
            }
            if (playerScore === dealerScore) {
                console.log(prefix + "PUSH- sO CLOSE...");
            }
            else if (playerScore > dealerScore) {
                console.log(prefix + "WIN- Congrats!");
            }
            else {
                console.log(prefix + "LOSS- Bettler luck next time.");
            }
        }
    }
    askChoice(prompt, options) {
        let ans = "";
        while (!options.includes(ans)) {
            ans = readline_sync_1.default.question(prompt).trim().toLowerCase();
        }
        return ans;
    }
    // convert number to oridinal string
    ordinal(n) {
        if (n === 1)
            return "1st";
        if (n === 2)
            return "2nd";
        if (n === 3)
            return "3rd";
        return `${n}th`;
    }
}
new Game().run();
