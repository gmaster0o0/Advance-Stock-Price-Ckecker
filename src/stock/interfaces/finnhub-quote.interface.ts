export interface FinnhubQuote {
  /** Current price */
  c: number;
  /** High price */
  h: number;
  /** Low price */
  l: number;
  /** Open price */
  o: number;
  /** Previous close price */
  pc: number;
  /** Timestamp (Unix epoch) */
  t: number;
}
