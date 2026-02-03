export const ISLAMIC_QUOTES = [
    "Prayer is better than sleep.",
    "Take one step towards Allah, He runs towards you.",
    "Indeed, with hardship comes ease.",
    "Allah does not burden a soul beyond that it can bear.",
    "The best of you are those who are best to their families.",
    "Speak good or remain silent.",
    "Kindness is a mark of faith, and whoever has not kindness has not faith.",
    "Do not lose hope, nor be sad.",
    "He is with you wherever you are.",
    "Patience is beautiful.",
    "The world is a prison for the believer and a paradise for the disbeliever.",
    "Trust in Allah, but tie your camel.",
    "When you ask, ask Allah.",
    "Your Lord is most forgiving, full of mercy.",
    "Be patient, for the promise of Allah is true.",
    "Every soul shall taste death.",
    "Cleanliness is half of faith.",
    "Good manners are half of faith."
];

export const getDailyQuote = () => {
    // Implement a pseudo-random selection based on the day of the year
    // so the quote is consistent for the whole day.
    const date = new Date();
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Use dayOfYear to pick an index
    const index = dayOfYear % ISLAMIC_QUOTES.length;
    return ISLAMIC_QUOTES[index];
};
