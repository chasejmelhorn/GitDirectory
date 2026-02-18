
import readline from "readline-sync";

// enums representing the suits and ranks in a deck
enum Suit {
    Spade = "♤",
    Diamonds = "♢",
    Hearts = "♡",
    Clubs = "♧",
}

enum Rank {
    Ace = "A",
    Two = "2",
    Three = "3",
    Four = "4",
    Five = "5",
    Six = "6",
    Seven = "7",
    Eight = "8",
    Nine = "9",
    Ten = "10",
    Jack = "J",
    Queen = "Q",
    King = "K",
}

// represents an individual card
class Card {
    public readonly suit: Suit;
    public readonly rank: Rank;

    // creates a card with a suit and rank
    constructor(suit: Suit, rank: Rank) {
        this.suit = suit;
        this.rank = rank;
    }

    // Returns true if the given card is an ace
    isAce(): boolean {
        return this.rank === Rank.Ace;
    }

    // Returns the value of the cards 
    baseValue(): number {
        if (this.rank === Rank.Ace) return 11;
        if (this.rank === Rank.Jack
            || this.rank === Rank.Queen
            || this.rank === Rank.King) return 10;
        return Number(this.rank);
    }

    // convers the card into a string
    toString(): string {
        return this.rank + this.suit;
    }  
}   

// represent the full 52 card deck
class Deck {
    private cards: Card[] = [];

    // build and shuffle on creation
    constructor() {
        this.resetAndShuffle();
    }

    // rebuild the full deck and shuffle
    resetAndShuffle(): void {
        const fresh: Card[] = [];
        for (const suit of Object.values(Suit)) {
            for (const rank of Object.values(Rank)) {
                fresh.push(new Card(suit, rank));
            }
        }
        // using Fisher–Yates shuffle algorithm here
        for (let i = fresh.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() *  (i + 1));
            [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
        }
        this.cards = fresh;
    }

    // returns how many cards are in the deck
    remaining(): number {
        return this.cards.length;
    }

    // removes and returns the top card
    draw(): Card {
        const c = this. cards.pop();
        if (!c) throw new Error("Deck is out of cards.");
        return c;
    }
}

// represents the cards in hand
class Hand {
    private cards: Card[] = [];

    // start with two cards
    constructor(card1: Card, card2: Card) {
        this.cards.push(card1, card2);
    }

    // returns list of cards
    allCards(): readonly Card[] {
        return this.cards;
    }

    // add a card to hand
    add(card: Card): void {
        this.cards.push(card);
    }

    // calculate the value of cards in hand
    value(): number {
        let total = 0;
        let aces = 0;

        for (const c of this.cards) {
            total += c.baseValue();
            if (c.isAce()) aces++;
        }

        // if you were going to bust and aces are in hand, swich an 11 to a 1
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return total;
    }

    // true if two cards total 21
    isBlackjack(): boolean {
        return this.cards.length === 2 && this.value() === 21;
    }

    // true if hand value exceeds 21
    isBust(): boolean {
        return this.value() > 21;
    }
    
    // LOOK AT CAN SPLIT ANY TWO CARDS
    // true if hand contains two cards of equal value
    canSplit(): boolean {
        if (this.cards.length !== 2) return false;
        const [a, b] = this.cards;
        return a.baseValue() === b.baseValue();
    }

    // remove and return split card
    popSecondCard(): Card {
        if (this.cards.length !== 2) throw new Error("can only split a 2-card hand.");
        return this.cards.pop()!;
    }

    // returns strings of cards
    display(hideSecond:boolean = false): string {
        if (!hideSecond) return this.cards.map(String).join(" ");
        if (this.cards.length < 2) return this.cards.map(String).join(" ");
        return `${this.cards[0]} ??`;
    }
}

// represents a player
class Player {
    constructor(public readonly name: string) {}

    hands: Hand[] = [];

    // remove all cards in hand for a new round
    clearHands(): void {
        this.hands = [];
    }
}

// Dealer is set as a subclass of player
class Dealer extends Player {
    constructor() {
        super("Dealer");
    }

    // if the dealers total is less than 17 they must hit
    shouldHit(hand: Hand): boolean {
        return hand.value() < 17
    }
}

// main game 
class Game {
    private deck = new Deck();
    private dealer = new Dealer();
    private player = new Player("You");

    run(): void {
        while (true) {
            console.log();
            console.log("Blackjack");

            const choice = this.askChoice("Would you like to (p)lay or (q)uit?: ", ["p", "q"]);
            if (choice === "q") return;

            // reshuffle if the deck is low
            if (this.deck.remaining() < 30) {
                console.log("A new deck has been shuffled...");
                this.deck.resetAndShuffle();
            }

            this.playOneRound();
        }
    }

    // play one round
    private playOneRound(): void {
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
    private playerTurns(): void {
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

                let options: string[] = ["h", "s"];
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
    private printTable(hideDealerHoleCard: boolean): void {
        this.printDealer(hideDealerHoleCard);
        this.printPlayerHands();
        console.log();
    }

    // print dealsers hand 
    private printDealer(hide: boolean): void {
        const hand = this.dealer.hands[0];

        const shownCards = hide ? hand.display(true) : hand.display(false);

        const score = hide
            ? `>${hand.allCards()[0].baseValue()}`
            : `${hand.value()}`;

        console.log(`Dealer's hand: ${shownCards}  Score: ${score}`);
    }

    // prints players hand
    private printPlayerHands(): void {
        for (let i = 0; i < this.player.hands.length; i++) {
            const hand = this.player.hands[i];

            const label = 
                this.player.hands.length > 1
                ? `Your ${this.ordinal(i + 1)} hand: `
                : "Your Hand: ";
            
            console.log(`${label}${hand.display(false)}     Score: ${hand.value()}`);
        }
    }

    // compare values of cards and print winner
    private printResults(): void {
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
                continue
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
            } else if (playerScore > dealerScore) {
                console.log(prefix + "WIN- Congrats!");
            } else {
                console.log(prefix + "LOSS- Bettler luck next time.");
            }
        }
    }

    private askChoice(prompt: string, options: string[]): string {
        let ans = "";
        while (!options.includes(ans)) {
            ans = readline.question(prompt).trim().toLowerCase();
        }
        return ans;
    }

    // convert number to oridinal string
    private ordinal(n: number): string {
        if (n === 1) return "1st";
        if (n === 2) return "2nd";
        if (n === 3) return "3rd";
        return `${n}th`
    }
}

new Game().run();