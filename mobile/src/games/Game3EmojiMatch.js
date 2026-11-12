import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const EMOJIS = ['👓', '👑', '😭', '🖤', '💔', '🎸', '👻', '💚'];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Game3EmojiMatch({ onAnswer, disabled = false }) {
  const [deck, setDeck] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [mismatched, setMismatched] = useState([]);
  const [lockBoard, setLockBoard] = useState(false);
  const [pairsCount, setPairsCount] = useState(0);

  useEffect(() => {
    // 8 pairs (16 tiles total)
    const cards = shuffle([...EMOJIS, ...EMOJIS]).map((emoji, index) => ({
      id: index,
      emoji,
    }));
    setDeck(cards);
    setFlipped([]);
    setMatched([]);
    setMismatched([]);
    setPairsCount(0);
    setLockBoard(false);
  }, []);

  function handleCardPress(index) {
    if (disabled || lockBoard) return;
    if (flipped.includes(index) || matched.includes(index)) return;

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setLockBoard(true);
      const [idx1, idx2] = nextFlipped;
      const card1 = deck[idx1];
      const card2 = deck[idx2];

      if (card1.emoji === card2.emoji) {
        // MATCH
        setTimeout(() => {
          const nextMatched = [...matched, idx1, idx2];
          setMatched(nextMatched);
          setFlipped([]);
          setLockBoard(false);
          const newPairs = pairsCount + 1;
          setPairsCount(newPairs);

          if (onAnswer) {
            onAnswer('game3', true);
          }
        }, 300);
      } else {
        // MISMATCH
        setTimeout(() => {
          setMismatched([idx1, idx2]);
          if (onAnswer) {
            onAnswer('game3', false);
          }
          setTimeout(() => {
            setFlipped([]);
            setMismatched([]);
            setLockBoard(false);
          }, 700);
        }, 300);
      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleBadge}>
        <Text style={styles.titleText}>EMOJI MATCH</Text>
      </View>

      <View style={styles.boardCard}>
        <View style={styles.pairsRow}>
          <Text style={styles.pairsText}>PAIRS FOUND {pairsCount}/8</Text>
        </View>

        <View style={styles.grid}>
          {deck.map((card, index) => {
            const isFlipped = flipped.includes(index);
            const isMatched = matched.includes(index);
            const isMismatched = mismatched.includes(index);

            return (
              <Pressable
                key={card.id}
                onPress={() => handleCardPress(index)}
                style={[
                  styles.tile,
                  isMatched && styles.tileMatched,
                  isMismatched && styles.tileMismatched,
                  isFlipped && styles.tileFlipped,
                ]}
              >
                {isFlipped || isMatched ? (
                  <Text style={styles.emojiText}>{card.emoji}</Text>
                ) : (
                  <Text style={styles.questionText}>?</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.subtext}>TAP A TILE TO FLIP! FIND ALL PAIRS TO WIN.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  titleBadge: {
    backgroundColor: '#020a1c',
    borderWidth: 2,
    borderColor: '#00f0ff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  titleText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  boardCard: {
    width: '94%',
    backgroundColor: '#030b20',
    borderWidth: 2.5,
    borderColor: '#00f0ff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  pairsRow: {
    marginBottom: 8,
  },
  pairsText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 13,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#03102c',
    borderWidth: 2,
    borderColor: '#00f0ff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  tileFlipped: {
    backgroundColor: '#020a1c',
    borderColor: '#00f0ff',
  },
  tileMatched: {
    backgroundColor: '#031224',
    borderColor: '#00efa0',
  },
  tileMismatched: {
    borderColor: '#ff1a40',
  },
  questionText: {
    color: '#00f0ff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 20,
  },
  emojiText: {
    fontSize: 22,
  },
  subtext: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
});
