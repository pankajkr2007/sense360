export const canSpeak = () => 'speechSynthesis' in window;
export function speak(text: string): boolean {
  if (!canSpeak()) return false;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  return true;
}
export const stopSpeaking = () => { if (canSpeak()) window.speechSynthesis.cancel(); };
