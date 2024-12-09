const tg = window.Telegram.WebApp;

const urlParams = new URLSearchParams(window.location.search);
const numCards = parseInt(urlParams.get("num_cards"), 10) || 3;  // Default to 3 if not specified

const majorCards = [
    'the_fool', 'the_magician', 'the_high_priestess', 'the_empress', 'the_emperor',
    'the_hierophant', 'the_lovers', 'the_chariot', 'strength', 'the_hermit',
    'wheel_of_fortune', 'justice', 'the_hanged_man', 'death', 'temperance',
    'the_devil', 'the_tower', 'the_star', 'the_moon', 'the_sun',
    'judgement', 'the_world'
];

const minorSuit = ['wands', 'cups', 'pentacles', 'swords'];

const minorRanks = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Page', 'Knight', 'Queen', 'King'];

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];  // Swap elements
    }
}

function generateDeck() {
    let deck = [];
    majorCards.forEach(card => {
        deck.push({
            type: 'major',
            name: card,
            path: `images/major/${card}.png`
        });
    });

    minorSuit.forEach(suit => {
        minorRanks.forEach(rank => {
            deck.push({
                type: 'minor',
                suit: suit,
                rank: rank,
                path: `images/minor/${suit}/${rank}.png`
            });
        });
    });

    shuffleArray(deck);
    return deck;
}

let selectedCards = [];
let shuffledDeck = generateDeck();

function initializeCards() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const back = document.createElement('div');
        back.classList.add('back');

        const front = document.createElement('div');
        front.classList.add('front');

        // Append to the card
        card.appendChild(back);
        card.appendChild(front);
    });
}

function revealCard(cardElement, cardData) {
    cardElement.classList.add('flipped');

    const frontCard = cardElement.querySelector('.front');
    frontCard.style.backgroundImage = `url('${cardData.path}')`;

    // Optional: If you want to add title and rank/text on the front
    /*
    frontCard.innerHTML = `
        <h2>${cardData.type === 'major' ? capitalize(cardData.name.replace('_', ' ')) : cardData.rank + ' of ' + capitalize(cardData.suit)}</h2>
    `;
    */
}

function capitalize(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

async function sendDataToServer(data) {
    try {
        const response = await fetch("http://62.60.154.249:5000/getdata", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            return null;
        }

        const result = await response.json();
        console.log("Server response:", result);
        // Handle error
        return result;
    } catch (error) {
        // console.error("Error sending data to server:", error);
        // Handle error
        return null;
    }
}

// Handle card clicks
function handleCardClicks() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
        card.addEventListener('click', async () => {
            if (selectedCards.length < numCards && !card.classList.contains('flipped')) {
                const selectedCardData = shuffledDeck[selectedCards.length];
                selectedCards.push(selectedCardData);

                card.style.pointerEvents = 'none';

                revealCard(card, selectedCardData);

                if (selectedCards.length >= numCards) {
                    const cardsToSend = selectedCards.map(card => {
                        if (card.type === 'major') {
                            return `major/${card.name}.png`;
                        } else {
                            return `minor/${card.suit}/${card.rank}.png`;
                        }
                    });

                    const userData = {
                        user_id: tg.initDataUnsafe?.user?.id,
                        message: `${cardsToSend.join(", ")}`,
                        selected_cards: cardsToSend
                    };

                    try {
                        await sendDataToServer(userData);

                        const unselectedCards = Array.from(cards).filter(cardElement => !cardElement.classList.contains('flipped'));
                        unselectedCards.forEach(cardElement => {
                            cardElement.classList.add('hidden');
                        });

                        setTimeout(() => {
                            const selectedCardElements = Array.from(document.querySelectorAll('.card.flipped'));

                            selectedCardElements.forEach((cardElement, index) => {
                                cardElement.classList.add('centered-card');

                                const spacing = 100;
                                const totalWidth = (selectedCardElements.length - 1) * spacing;
                                const startX = -totalWidth / 2;

                                const offsetX = startX + index * spacing;

                                cardElement.style.transform = `translate(-50%, -50%) translateX(${offsetX}px) rotateY(180deg)`;
                            });

                            setTimeout(() => {
                                tg.close();
                            }, 5000);
                        }, 1000);
                    } catch (error) {
                        console.error("Failed to send data:", error);
                    }
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCards();
    handleCardClicks();
});
