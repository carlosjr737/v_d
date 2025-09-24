import { Card, IntensityLevel } from '../types/game';

const createSeedCard = (
  id: string,
  type: 'truth' | 'dare',
  text: string,
  level: IntensityLevel
): Card => ({
  id,
  type,
  text,
  level,
  isBoosted: false,
  isCustom: false,
});

export const seedCards: Card[] = [
  // LEVE - Verdades
  createSeedCard('leve-v1', 'truth', 'Qual a pior cantada que você já recebeu?', 'leve'),
  createSeedCard('leve-v2', 'truth', 'Qual seu crush de infância famoso?', 'leve'),
  createSeedCard('leve-v3', 'truth', 'Qual foi a sua maior vergonha na escola?', 'leve'),
  createSeedCard('leve-v4', 'truth', 'Qual é a sua mania mais estranha?', 'leve'),
  createSeedCard('leve-v5', 'truth', 'Qual foi o presente mais inusitado que você já ganhou?', 'leve'),
  createSeedCard('leve-v6', 'truth', 'Qual é a sua comida guilty pleasure?', 'leve'),
  createSeedCard('leve-v7', 'truth', 'Qual foi a mentira mais boba que você já contou?', 'leve'),
  createSeedCard('leve-v8', 'truth', 'Qual é o seu medo mais bobo?', 'leve'),
  createSeedCard('leve-v9', 'truth', 'Qual foi a sua fase mais constrangedora?', 'leve'),
  createSeedCard('leve-v10', 'truth', 'Qual é o seu talento secreto?', 'leve'),

  // LEVE - Desafios
  createSeedCard('leve-d1', 'dare', 'Fale com sotaque de Portugal até sua próxima vez.', 'leve'),
  createSeedCard('leve-d2', 'dare', 'Conte uma piada ruim sem rir.', 'leve'),
  createSeedCard('leve-d3', 'dare', 'Imite um animal até alguém adivinhar qual é.', 'leve'),
  createSeedCard('leve-d4', 'dare', 'Cante o refrão de uma música infantil.', 'leve'),
  createSeedCard('leve-d5', 'dare', 'Faça uma pose de ioga por 30 segundos.', 'leve'),
  createSeedCard('leve-d6', 'dare', 'Fale apenas fazendo pergunta até sua próxima vez.', 'leve'),
  createSeedCard('leve-d7', 'dare', 'Faça um elogio exagerado para cada pessoa aqui.', 'leve'),
  createSeedCard('leve-d8', 'dare', 'Dance como se ninguém estivesse vendo por 15 segundos.', 'leve'),
  createSeedCard('leve-d9', 'dare', 'Fale como um repórter esportivo por 1 minuto.', 'leve'),
  createSeedCard('leve-d10', 'dare', 'Faça caras e bocas até alguém rir.', 'leve'),

  // MÉDIO - Verdades
  createSeedCard('medio-v1', 'truth', 'Das pessoas aqui, com quem você iria num segundo encontro?', 'medio'),
  createSeedCard('medio-v2', 'truth', 'Prefere olhar, sorriso ou voz?', 'medio'),
  createSeedCard('medio-v3', 'truth', 'Qual foi o seu primeiro beijo? Como foi?', 'medio'),
  createSeedCard('medio-v4', 'truth', 'Você já teve uma paixão não correspondida?', 'medio'),
  createSeedCard('medio-v5', 'truth', 'Qual é a sua maior insegurança física?', 'medio'),
  createSeedCard('medio-v6', 'truth', 'Você já ficou com alguém só por carência?', 'medio'),
  createSeedCard('medio-v7', 'truth', 'Qual foi a situação mais constrangedora em um encontro?', 'medio'),
  createSeedCard('medio-v8', 'truth', 'Você já teve ciúmes de um amigo?', 'medio'),
  createSeedCard('medio-v9', 'truth', 'Qual é o seu tipo ideal fisicamente?', 'medio'),
  createSeedCard('medio-v10', 'truth', 'Você já mentiu sobre sua idade para alguém?', 'medio'),

  // MÉDIO - Desafios
  createSeedCard('medio-d1', 'dare', 'Elogie algo específico da pessoa à direita.', 'medio'),
  createSeedCard('medio-d2', 'dare', 'Dance 15s com alguém.', 'medio'),
  createSeedCard('medio-d3', 'dare', 'Sussurre algo fofo no ouvido de alguém.', 'medio'),
  createSeedCard('medio-d4', 'dare', 'Faça uma massagem nos ombros de alguém por 30s.', 'medio'),
  createSeedCard('medio-d5', 'dare', 'Dê um abraço de urso em cada pessoa.', 'medio'),
  createSeedCard('medio-d6', 'dare', 'Conte um segredo bobo seu para o grupo.', 'medio'),
  createSeedCard('medio-d7', 'dare', 'Faça uma declaração de amor platônico para alguém.', 'medio'),
  createSeedCard('medio-d8', 'dare', 'Deixe alguém escolher uma pose para você fazer e postar.', 'medio'),
  createSeedCard('medio-d9', 'dare', 'Cante uma música romântica olhando nos olhos de alguém.', 'medio'),
  createSeedCard('medio-d10', 'dare', 'Fale sobre o que mais te atrai na pessoa à esquerda.', 'medio'),

  // PESADO - Verdades
  createSeedCard('pesado-v1', 'truth', 'Uma fantasia que te intriga (sem detalhes).', 'pesado'),
  createSeedCard('pesado-v2', 'truth', 'Três turn-ons e dois turn-offs.', 'pesado'),
  createSeedCard('pesado-v3', 'truth', 'Qual foi a sua experiência mais ousada?', 'pesado'),
  createSeedCard('pesado-v4', 'truth', 'Você já teve interesse romântico em alguém aqui?', 'pesado'),
  createSeedCard('pesado-v5', 'truth', 'Qual parte do corpo você mais repara em alguém?', 'pesado'),
  createSeedCard('pesado-v6', 'truth', 'Você prefere ser dominante ou submisso?', 'pesado'),
  createSeedCard('pesado-v7', 'truth', 'Qual foi o lugar mais inusitado que você já beijou alguém?', 'pesado'),
  createSeedCard('pesado-v8', 'truth', 'Você já teve sonhos eróticos com alguém que conhece?', 'pesado'),
  createSeedCard('pesado-v9', 'truth', 'Qual é a sua zona erógena mais sensível?', 'pesado'),
  createSeedCard('pesado-v10', 'truth', 'Você já fez algo que seus pais nunca podem descobrir?', 'pesado'),

  // PESADO - Desafios
  createSeedCard('pesado-d1', 'dare', 'Lap dance 20–30s se ambos toparem.', 'pesado'),
  createSeedCard('pesado-d2', 'dare', 'ASMR 15s no ouvido (neutro).', 'pesado'),
  createSeedCard('pesado-d3', 'dare', 'Beije o pescoço de alguém por 5 segundos.', 'pesado'),
  createSeedCard('pesado-d4', 'dare', 'Faça uma massagem sensual nas mãos de alguém.', 'pesado'),
  createSeedCard('pesado-d5', 'dare', 'Sussurre algo sedutor no ouvido de alguém.', 'pesado'),
  createSeedCard('pesado-d6', 'dare', 'Dance de forma sensual por 20 segundos.', 'pesado'),
  createSeedCard('pesado-d7', 'dare', 'Dê uma mordidinha de leve no lóbulo da orelha de alguém.', 'pesado'),
  createSeedCard('pesado-d8', 'dare', 'Faça carinho no cabelo de alguém por 30 segundos.', 'pesado'),
  createSeedCard('pesado-d9', 'dare', 'Olhe fixamente nos olhos de alguém por 20 segundos.', 'pesado'),
  createSeedCard('pesado-d10', 'dare', 'Sussurre o que você faria se fossem só vocês dois.', 'pesado'),

  // EXTREMO - Verdades
  createSeedCard('extremo-v1', 'truth', 'Uma fantasia que só faria com a pessoa certa.', 'extremo'),
  createSeedCard('extremo-v2', 'truth', '3 limites inegociáveis.', 'extremo'),
  createSeedCard('extremo-v3', 'truth', 'Qual é o seu fetiche mais secreto?', 'extremo'),
  createSeedCard('extremo-v4', 'truth', 'Você já teve atração por alguém proibido?', 'extremo'),
  createSeedCard('extremo-v5', 'truth', 'Qual foi a sua experiência mais intensa?', 'extremo'),
  createSeedCard('extremo-v6', 'truth', 'Você toparia um ménage? Com quem?', 'extremo'),
  createSeedCard('extremo-v7', 'truth', 'Qual é o seu maior desejo sexual não realizado?', 'extremo'),
  createSeedCard('extremo-v8', 'truth', 'Você já traiu ou foi traído? Como foi?', 'extremo'),
  createSeedCard('extremo-v9', 'truth', 'O que te deixa mais excitado mentalmente?', 'extremo'),
  createSeedCard('extremo-v10', 'truth', 'Se pudesse realizar uma fantasia hoje, qual seria?', 'extremo'),

  // EXTREMO - Desafios
  createSeedCard('extremo-d1', 'dare', 'Role-play 30s sem falas explícitas.', 'extremo'),
  createSeedCard('extremo-d2', 'dare', 'Dance lentamente testa com testa 20s.', 'extremo'),
  createSeedCard('extremo-d3', 'dare', 'Faça uma massagem corporal sensual por 1 minuto.', 'extremo'),
  createSeedCard('extremo-d4', 'dare', 'Beije apaixonadamente por 10 segundos.', 'extremo'),
  createSeedCard('extremo-d5', 'dare', 'Sussurre uma fantasia no ouvido de alguém.', 'extremo'),
  createSeedCard('extremo-d6', 'dare', 'Faça um strip-tease sensual por 30 segundos.', 'extremo'),
  createSeedCard('extremo-d7', 'dare', 'Simule uma cena romântica de filme por 1 minuto.', 'extremo'),
  createSeedCard('extremo-d8', 'dare', 'Faça carinho íntimo (respeitando limites) por 20s.', 'extremo'),
  createSeedCard('extremo-d9', 'dare', 'Deite junto e sussurre desejos por 30 segundos.', 'extremo'),
  createSeedCard('extremo-d10', 'dare', 'Escolha uma posição íntima e fiquem assim por 15s.', 'extremo'),
];