window.Game = window.Game || {};

(function () {
  const FIRST_NAMES = [
    "Alexander", "Andreas", "Armin", "Arne", "Axel", "Bernd", "Bernhard", "Björn", "Carsten", "Christian",
    "Christoph", "Daniel", "David", "Dennis", "Dieter", "Dirk", "Eberhard", "Emil", "Erik", "Ernst",
    "Felix", "Florian", "Frank", "Franz", "Friedrich", "Gerhard", "Günter", "Hans", "Harald", "Heinrich",
    "Heinz", "Helmut", "Herbert", "Hermann", "Holger", "Horst", "Jakob", "Jan", "Jens", "Joachim",
    "Johannes", "Jörg", "Josef", "Jürgen", "Kai", "Karl", "Klaus", "Kurt", "Lars", "Leon",
    "Lukas", "Manfred", "Marcel", "Marco", "Marcus", "Mario", "Markus", "Martin", "Matthias", "Max",
    "Maximilian", "Michael", "Norbert", "Olaf", "Oliver", "Patrick", "Paul", "Philipp", "Rainer", "Ralf",
    "Ralph", "Reinhard", "Robert", "Roland", "Rolf", "Rudolf", "Sebastian", "Simon", "Stefan", "Stephan",
    "Sven", "Thomas", "Thorsten", "Tim", "Tobias", "Udo", "Ulrich", "Uwe", "Volker", "Walter",
    "Werner", "Wolfgang", "Yusuf", "Adam", "Adrian", "Albert", "Alfred", "Andre", "Anton", "Achim",
    "Bastian", "Benedikt", "Benjamin", "Bodo", "Bruno", "Claus", "Clemens", "Conrad", "Detlef", "Dietmar",
    "Dominik", "Egon", "Elias", "Emanuel", "Eugen", "Fabian", "Ferdinand", "Finn", "Friedhelm", "Georg",
    "Gerd", "Gustav", "Hannes", "Hartmut", "Hauke", "Heiko", "Helge", "Henning", "Henry", "Hubert",
    "Ingo", "Ivan", "Jannik", "Jasper", "Jochen", "Jonas", "Julian", "Justin", "Kilian", "Konrad",
    "Leander", "Leo", "Leopold", "Linus", "Lorenz", "Luis", "Malte", "Manuel", "Marc", "Mats",
    "Milan", "Moritz", "Nick", "Nico", "Niklas", "Noah", "Oskar", "Otto", "Pascal", "Peter", "Piet",
    "Ragnar", "Rasmus", "Rene", "Richard", "Rick", "Robin", "Roman", "Samuel", "Sascha", "Silas"
  ];

  const LAST_NAMES = [
    "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
    "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann",
    "Braun", "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner", "Schmitz", "Krause", "Meier",
    "Lehmann", "Schmid", "Schulze", "Maier", "Köhler", "Herrmann", "König", "Mayer", "Walter", "Huber",
    "Kaiser", "Fuchs", "Peters", "Lang", "Scholz", "Möller", "Weiß", "Jung", "Hahn", "Schubert",
    "Vogel", "Friedrichshoff", "Keller", "Günther", "Frank", "Berger", "Winkler", "Roth", "Beck", "Lorenz",
    "Baumann", "Franke", "Albrecht", "Schuster", "Simon", "Ludwig", "Böhm", "Winter", "Kraus", "Martin",
    "Schumacher", "Krämer", "Vogt", "Stein", "Jäger", "Otto", "Sommer", "Groß", "Seidel", "Heinrich",
    "Brandt", "Haas", "Schreiber", "Graf", "Schulte", "Dietrich", "Ziegler", "Kuhn", "Kühn", "Pohl",
    "Engel", "Horn", "Busch", "Bergmann", "Thomas", "Voigt", "Sauer", "Arnold", "Wolff", "Pfeiffer",
    "Geiger", "Winkler", "Hermann", "Kramer", "Pfeifer", "Lucas", "Kunze", "Wenzel", "Jost", "Bachmann",
    "Wittmann", "Kraft", "Bayer", "Michel", "Eckert", "Schindler", "Seifert", "Döring", "Hesse", "Hein",
    "Kluge", "Kohl", "Herzog", "Buck", "Fuchs", "Ernst", "Wenz", "Löffler", "Hirsch", "Ritter",
    "Geisler", "Bender", "Kunz", "Harms", "Schenk", "Voss", "Wegner", "Stark", "Maaß", "Bock",
    "Gärtner", "Rau", "Haase", "Krebs", "Sauter", "Reuter", "Schweizer", "Hentschel", "Sturm", "Mayr", "Schulze König"
  ];

  Game.Names = {
    firstNames: FIRST_NAMES,
    lastNames: LAST_NAMES,
    randomFullName() {
      const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      return f + ' ' + l;
    }
  };
})();