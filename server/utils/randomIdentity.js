const ADJECTIVES = [
    "Silent", "Brave", "Clever", "Swift", "Mystic",
    "Gentle", "Bold", "Curious", "Lucky", "Quiet",
    "Wild", "Calm", "Fierce", "Witty", "Sunny",
];

const ANIMALS = [
    "Fox", "Panda", "Falcon", "Otter", "Wolf",
    "Tiger", "Owl", "Dolphin", "Lynx", "Raven",
    "Bear", "Hawk", "Rabbit", "Turtle", "Koala",
];

export function generateDisplayName() {

    const adjective =
        ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];

    const animal =
        ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

    const number = Math.floor(Math.random() * 900) + 100;

    return `${adjective} ${animal} ${number}`;

}

export function generateAvatarUrl(seed) {

    // DiceBear's free avatar API — generates a consistent image from a seed
    // string, so the same anonymous account keeps the same avatar look
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
        seed
    )}`;

}
