/* Radiostudio · Sendermodul für Unreal Nova 2000. */
(() => {
'use strict';
// v95: PLANE, new text supplied by the author („Plane für Jürgen“). The old corpus is gone.
// Finite verb forms below cover both texts; the clause check uses them.
const CORPUS = ["Unter der Plane ist alles.", "Seitdem die Plane über die Stadt gelegt wurde, ist die Erde eine Ebene. Am Ende der Kurve gibt es kein Verschwinden, hinter der Krümmung kein Versteck, was wir nicht sehen, existiert nicht, außerhalb der Plane gibt eDie Signale der Anlagen blinken tagein tagaus, in der Nacht und am Tag. Wenn vor der Frühe die Sonne gravid sich über den Planenrand hievt, bohren sich ihre Strahlen durch die Plane und fallen dumpf auf ihre Rohre. Dann öffnet die neue Schicht wieder die Tore, während hinten bei den Haufen das Feuer schon brennt. Jede Nacht sterben Menschen in den Anlagen. Die Schwaden zeigen es an. (…) Wir erinnern uns nicht und wissen es doch. Irgendwann bin ich aufgewacht, das heißt, irgendwann muss ich eingeschlafen sein.", "Unter der Plane ist Nichts, unter der Plane kein Gestern, kein Morgen, nur jetzt. Die Ränder der Plane sehen wir nicht, für uns gibt es diese Ränder nicht. Die Plane fängt die losen Fäden unserer Existenz und spannt sie zum Gewölbe, das uns schützt, sie zieht uns zusammen und spannt einen Raum auf, unter dem wir uns konzentrieren, der uns konzentriert, sie zieht die Buchstaben zu Wörter, die Wörter zu Sätze zusammen und spannt die Geschichte auf, die unser Raum ist. Nichts ist außerhalb der Geschichte, nichts existiert außerhalb dieser Sprache, zwischen diesen Zeilen befindet sich nichts.", "Aber irgendwann bin ich aufgewacht, also muss ich irgendwann eingeschlafen sein.", "Renata dreht den Kopf. Neben ihr liegt der mumifizierte Körper von Saschas Geschichte. Sie rollt sich am Boden vor dem Bett in ihre Gewissheiten ein und sehnt sich nach einem Ausdruck, einer akustischen Gitarre zum Beispiel, und überlegt aus dem Altbauparkett Holzscheite für ein Lagerfeuer auszureißen, um sich an der Idylle zu wärmen. Aber das würde sie niemals tun. Sie steht auf und verlässt die Wohnung, um ihre Liebe wieder in fremden Gesichtern spazieren zu führen. Tauben flattern auf, fliegen in verschiedene Richtungen, fliegen gegen die Plane, manche brechen sich das Genick, schreien wie die Säuglinge im Fall, landen vor unseren Füßen. Die Stadt ist ein Lager geworden. Wir gehen mit gekrümmten Wirbelsäulen durch die Straßen und eilig wieder zurück, hinein, in Zement- oder Zelthöhlen, oder in die Arbeit, wenn wir eine haben. Renata hat Glück. Sie steigt in den neuen Hochgeschwindigkeitszug.", "Tore öffnen sich. Die Luft ist schwer mit Wasser beladen. Renata setzt ihre Sonnenbrille auf. Nach einem Doppeldienst blendet sie das künstliche Tageslicht immer noch. Sie bekommt Kopfweh. Gestern haben wieder Sonnenstürme die Erdatmosphäre erreicht. Der Strom wird nicht reichen. Sie geht Kerzen besorgen.", "Auf dem Heimweg sieht sie nach Wochen Rücken sich aufwölben, Menschen recken ihre Gesichter nach einer brüchigen Stelle in der Plane, durch die Sonne sickert. Ich stelle mich zu den Anderen. Am Flachdach gegenüber hängt eine Gestalt weiße Leintücher auf eine kreisförmige Wäschespinne. Langsam setzt die Wirkung von Vitamin D ein. Wir lächeln einander an, sprechen kein Wort und halten die Gesichter weiter in die Sonne. An einem Schaufenster knicken ihre Strahlen am Glas, vermindern ihre Geschwindigkeit und breiten sich in meinem Blick durch die Brille spektralfarben schillernd aus, das Strahlenbündel wirf sich auf mich, kitzelt die Nerven meiner Nase, die das Kribbeln in die unter der Haut an den Innenseiten meiner Handgelenke schlummernden Knospen überträgt und eine Wärme weckt, die tränt, aus den sie umschließenden Hüllenblättern, in meinen Händen streut und diffus durch die Nervenzweige meines gesamten Körpers streunt, einen Strauß Funkeln im Becken bindet und schließlich ins Hirn hinauf schießt. Es brennt unter der Haut an den Innenseiten meiner Handgelenke. Das Bild meiner Oma, zu Ostern in Italien taucht durch das Brennen und in meinem Bewusstsein auf. Meine Oma, zu Ostern in Italien, als wir noch alle durch die Gegend geflogen sind – wer ist eigentlich wir? Meine Familie? Wer ist meine Familie? – wie sie ihr blasses Gesicht der Sonne zuwendet, geschlossene Augen, seelig, wie auf den Heiligenbildern in den Kirchen, und ich denke, dass sie uns damals vielleicht alle erstochen hätte, mit ihrem Osterfleischmesser, wenn es ihr der Sicherheitsbeamte am Flughafen nicht abgenommen hätte. Ich halte jetzt, wie meine Oma, aber schmerzverzerrt das Gesicht weiter in die Sonne und frage mich, ob ich dich mit einem Osterfleischmesser abstechen könnte. Nein, geht nicht.", "Mein Herz schlägt schnell. Die Erinnerung droht die Knospenhüllen unter der Haut meiner Handgelenke zu zerreißen. Überwinden muss ich mich trotzdem, aus dem durch die Plane stechenden Lichtkegel zu treten. Jetzt wende ich mich ab, höre die Anderen, Schmerz zischt zwischen Zähnen, ich schaue, sehe sie gekrümmt, sie reiben sich die Handgelenke.", "Am Dach gegenüber dreht der Wind die Wäsche auf einer Spinne im Kreis.", "Zu Hause rolle ich mich am Fuße des Bettes zusammen und lege die Arme um meine angewinkelten Beine. Du bist nicht da. Ich versuche zu sterben, einfach zu sterben, oder wenigstens zu verschwinden, geht aber nicht. Die Wohnung ist laut. Ich trage Erde in den Adern und mich ins andere Zimmer, fürchte mich plötzlich vor dem Innenraum meines Körpers. In meiner Bauchhöhle koitieren Kinder. Sie vermehren sich gewaltig schnell, ich drohe zu platzen, ich weiß, dass ich sie fressen muss, also versuche ich sie auszuscheißen, sie befinden sich ja in mir drinnen, aber meine eigene Scheiße kann ich einfach nicht fressen. Dann kommst du zurück und drängst mich in die Ecke deiner Angst. Ich möchte dir erzählen, wie meine Oma durch die Plane sank, ich öffne meine Lippen, aber deine stille Eifersucht, tropft in das Becken unseres Nachmittags, meine Worte sind Wespen, sie tummeln sich am Rand, sie versuchen zu trinken, ihre Füßchen verkleben, ihre Flügel, die Hinterteile fiepen nervös und sie strampeln sich hektisch aus dem Schleim deines Schweigens und sterben langsam darin, ihre Laichen, ich meine Leichen, schwappen über den Beckenrand, Chöre aus Schweigen jetzt, schwarzgelb, schutzlos perlen sie auf die ewigen Felder und rotten, planlos in gleißendem Sonnenlicht. Ich wundere mich, ob deine Speichelfische nach Orakelsprüchen suchen, in meinem Schenkelsee, aber dann ernte ich die Leichen, ich meine Laichen, aus deinen Beckenblüten, die zittern, wie Gräser in früheren Frühlingen und ich versuche mich in Ordnung zu legen, während die Strafe einer Horde mein Hirn faschiert und mir die Bilder eines Verbrechens einspritzt, das nicht meines war.", "Schenk mir eine Lampe, sage ich, es ist so dunkel, nicht einmal das Wort Verzweiflung hat eine Geschichte, weißt du? Du lobst mich für meine Bildung. Ich will dir etwas mitteilen, über das zwischen uns, wie das ist und wie das war mit mir früher und was passiert ist in - „Still, still“ singt sie dann, die Horde und lutscht an kotigen Fingern, schmiert die Wände unserer Wohnung voll und die Knospen schmerzen unter meiner Haut.", "Jetzt sehe ich dich Sirenen hören, Aiaaia, Wasserfrüchte schlürfen, Würg´ mich noch ein bisschen, komm! Würg! Und ich beginne schon, dich zu verachten, weil du dich nicht traust, mit deinen fragilen Händen, verachte ich dich ein wenig, heimlich, während hinter dem Fenster ein Baum blattzittrig in die Nacht explodiert, während du - “Still, still, still, weil “ - endlich eingeschlafen bist. Ich verachte dich ein bisschen, für deine Wahl der Melancholie, die wie Seide fein, exquisit, exquisit, auf deiner weichen Haut liegt, für deine Beziehungen in Pastellfarben und deine teuer geschnittene Frisur. Und ich verachte dich vor allem, weil du eine Familie hast, weil du eine Geschichte hast, in der ich nicht vor- die mir aber so nahekommt und an die du dich, wofür du nichts und dich nicht erinnern kannst. Sie ist das Schweigen am Tisch, die Pause zwischen den Worten, der kontrollierende Blick in den Spiegel, die Unruhe im Bett, das Prickeln auf der Kopfhaut, die Kälte im Nacken, das Drücken unter den Rippen, dein Stirnrunzeln bei Nähe, die bedächtige Handhabung von Besteck, die sorgfältige Faltung deiner Oberteile, die tauben Stellen auf deinem Bauch, das Jucken an deinen Knöcheln und dann wünsche ich dich in allen Jahren und möchte verhänden mich, durch deine Kindheit mähen, ihr Schnittgras frisch an unseren Fenstern stehen sehen und erliege deinem Charme und verliebe mich in deinen Zustand, weil: du hast die Liebe, die mir fehlt.", "Ich atme, rauche, asche, Gedanken flattern jetzt gazeweiß, pale. Ich sitze am geöffneten Fenster, gegenüber glimmt auch eine Zigarette auf, dann sehe ich, wie deine Geschichte, diese Mumie einen Arm um dich legt. Du redest im Traum in einer Sprache die es nicht gibt.", "Bevor du eingeschlafen bist, brach ein Meer aus Steinen in den Wohnzimmerabend, Geschwistersalz, die antike Hitze in meiner Kinderscheide schrie deinen Tinitus fast zu Tode. Jetzt stürzen Sterne im Koma auf den Schlafzimmermorgen, malignes Mondmuttergestein meiner Vorzeit, betrunken von anderen Himmeln, wecke ich deine Zweifel, Aiaia, du nähst dich in Stierfell, ich fliege nach Griechenland. Nein. Geht nicht.", "Irgendwann bin ich aufgewacht, das heißt: Irgendwann muss ich eingeschlafen sein. Schreie klatschen wie Squaschbälle zwischen Häuserwänden hin und her. Ich gehe ans Fenster. Die kleine Alte mit den Goldzähnen steht hinten links im Hof, beim Kirschbaum steht und schaut und schreit, ich sehe nicht weswegen.", "„Guten Morgen.“", "„Guten Morgen.“", "In unserer Straße wurde wieder gekämpft. Wir trinken Kaffee. Bevor du gehst, sammle ich die Splitter von dir auf und verwahre sie in meiner Innentasche. Wenn du weg bist, werde ich sie zusammensetzen, aber immer fehlen Splitter und dann erschrecke ich über der Hässlichkeit der Fratze, die mir von dir bleibt.", "„Guten Morgen.“", "„Guten Morgen.“", "„Hast du dich entschieden?“", "„Nein.“", "Wir verlassen die Wohnung in Richtung Wiesenkabine. An der Stelle von vorgestern starren noch immer ein paar Menschen nach oben, die Innenseiten meiner Handgelenke sind geschwollen und gerötet. Vorgestern, gestern…schimmelt schon in einem mir versperrten Areal meines Gedächtnisses vor sich hin. Ich schaue nach oben, die Plane wurde geflickt. In der Wiesenkabine riecht es ein bisschen zu aufdringlich nach Gras. “Ich muss jetzt Geld verdienen gehen“.", "Auf dem Weg in die Hallen, versuche mich in den Gesichtern der Anderen wieder zu finden, aber die Klitoris meiner Iris ist rasch überreizt. Urin schießt aus meinen Pupillen und ätzt wen er trifft. Ich biege um die Ecke, in der Hoffnung auf eine menschenleere Straße. Goldzähne blitzen aus einem Gebiss. Während Hündchen gegen Hauswand pisst, grinst und grüßt die kleine Alte aus dem Wohnhaus schon, noch bevor ich umdrehen kann. Hündchen bellt, blechern, mit überstrecktem Hals, von unten herauf, die Alte reißt an der Leine und schüttet mir aus einem Papiersack ihr Zeitungswissen über den Kopf. Ich weiß nicht was ich sagen soll. Mein Herz klopft. Weiß nichts weiß nichts weiß gar nichts. Ich hebe ein Zeitungsblatt auf und lese laut vor. Sie legt ihre Goldzähne frei, Hündchen springt an mir hoch und hechelt. Ich gehe weiter, drehe mich noch einmal um. Sie zieht das am Hintern sitzende Viech hinter sich her. Es keift.", "In meinem Kopf hockt nackt eine Horde, Münder vernäht, Beine geöffnet. Die Horde sabbert Botschaften aus Beckenlippen. Gemächlich tropft Spraschschleim undeutlich auf die Windungen meines Hirns und kontaminiert das Wasser, in dem Gedanken wachsen, aber keine Bilder blühen. Jetzt erwacht die Horde nach und nach und wetzt die stumpfen Klingen ihrer Messer, käscht nach Silbenfischen, hält sie fest mit der einen Hand und mit der anderen: Fingerchen um Messergriff, Gedankenkopf vom Körper trennen, diesen auf den Traumstein schlagen bis das Zucken erlischt, Silber der Silben entschuppen, Bewegung aus dem Ellebogen: Eleganter Filetismus, Bauchhälften aufklappen, zerteilen, geht ganz schnell. Die Silbenfischköpfe winden sich schwimmend weiter, die Gräten der Bedeutung nisten sich schwarz, am Rand meiner Hirnschale. Immer wieder versuche ich aus dem Inneren des Schädels mit der Gabel einer warmen Stimme über meinen Ohrkanal den Schmelz, der da juckt, der da fürchterlich juckt und auf meine Augen drückt, heraus zu schaben, um mir eine Erinnerung zu modellieren. Hat aber noch nie geklappt. Ich laufe nach Hause, bleibe wieder an der Stelle der Plane stehen, Hoffnung, schaue hinauf, nichts, alles dicht, kein frisches Licht, das im Schaufenster bricht, aber etwas schillert da durch, Gestalten die winken, mir zu? Ich trete näher, lege ein Händerund zum Dach fürs Schauen ans Gesicht, die leuchtenden Knospen unter meiner Haut spiegeln sich im Glas, ich zucke zusammen. In meiner Wohnung angekommen, lasse ich kaltes Wasser über meine Hände laufen, sehe im Spiegel die rote Adernspur der Hundeanuswunde in der Straße meines Auges. Die Horde werkt noch immer, schuppt und schneidet und hackt und schleimt wirre Botschaften ins Hirnwasser, die Silben fließen in die verschiedenen Regionen meines Körpers, flüstern in meinen Fingern, in den Zehen, hinter den Ohren, krächzen aus dem Bauchnabel, drücken, krampfen, wenn ich versuche zu verstehen, zu entziffern, werden sie sich noch weiter ausbreiten, meinen Körper in Besitz nehmen, muss aufpassen, muss es kontrollieren, muss Mullbinde von deiner Geschichte reißen und meine Körperstellen damit abbinden. Du bist aber nicht da.", "Wenn die Horde fleißig war, muss sie meistens lange rasten. Das ist der Vorteil. Ich habe Hunger nach Luft, reiße ein Fenster im Wohnzimmer auf, es ist schwül und wieder wenig Sauerstoff, ich schaue die lange Straßenflucht hinunter. Eine Gruppe grölt, randaliert. Gegenüber lugen ausgezerrte Gesichter aus aufgerissenen Fenstern. Eines schreit nach Ruhe. Ein Schwarm Elektrorollern kreiselt die Gruppe ein. Eine Taube fliegt auf mich zu, sie setzt sich auf die Fensterbank und zerhackt einen Zweig. Ich werde heute nicht zur Arbeit gehen.", "Gedanken rutschen die Hänge der Tage ab im Versuch einen Halt zu finden.", "Habe wieder Kopfweh. Vom letzten Stock aus sehe ich die Haufen hinter den Hallen. Da tauchen jetzt kleine Figuren auf. Schwebende Schatten? Ein paar schweben durch die Luft auf die Halle und direkt auf das Fenster an dem ich stehe zu. Die Kollegin fragt wo ich bleibe, ich töte meine Zigarette aus, löse meine Versteinerung und laufe den Gang hinunter zurück an meinen Arbeitsplatz. Die Regeln haben sich schon wieder geändert.", "Heute bin ich beim Faktencheck, dann Leistungscheck eingeteilt. Alle Ankommenden müssen erfasst werden. Zuerst wird der Name des Familienoberhaupts in das interne Dokumentationssystem eingetragen. Ich habe Schwierigkeiten, die sonst automatisierten Bewegungen stocken, ich mache Fehler, während die anderen die Choreographie des Verwaltungsballetts perfekt beherrschen.", "Die Kälte reißt uns in den Knochen, wir ziehen die Gliedmaßen, die Schultern, die Gedanken zusammen, sogar die Luft ziehen wir ein, wenn wir Worte ausstoßen, um nichts von der Wärme in unserer Mundhöhle zu verlieren. Diejenigen, die an den Bildschirmen sitzen, kleben ihre Unterarme angewinkelt an die Oberkörper, die Finger hämmern auf die Tasten. Aus dem Seitenwinkel sehe ich sie abfallen, auf die Tastatur klirren und zerbersten.", "Während er einen Akt bearbeitet, fährt sich mein Kollege mit den Fingern in die fettigen Locken, führt sie an seine Nase, an den Hals, reißt sich einzelne Barthaare aus und betrachtet die Haarwurzel, nachdenklich. Ich sehe ihr Weiß, wie der, die Insekten in die Flucht schlagende Latexsaft des Löwenzahns, dreht sich dieser milchige Punkt am Ende des Stoppels. Hinter dem meterlangen Pult sitzen die Wartenden in Reihen geschlichtet mit ausdruckslosen Blicken, bleichen Gesichtern und gezeichneten Körpern.", "Wir wissen nichts, vor allem weder ein noch aus, nur, dass immer mehr Menschen ankommen, wissen wir. Wir erfassen und kategorisieren sie, diejenigen, die nicht aufgenommen werden, weinen, wehren sich, schreien, schlagen um sich, werden sofort in Halle 3 abgeführt.", "Heute Morgen habe ich einen Traum geerntet. Das gelingt selten und nur, wenn er überwiegend aus Tagesresten besteht und wenig Erinnerungsmaterial aufweist. Ich bin mit dem Fahrrad zu meiner Wohnung gefahren. Zwei Straßenarbeiter schweißten Schienen. In den Boden eingelassen waren nur ihre Oberkörper sichtbar. Die Funken sprühten, ich roch ihr Knistern, noch bevor ich die erleuchteten Gesichter der Männer sah. Ich blieb kurz stehen und betrachtete sie, die heute schon wie Ikonen aus einer anderen Zeit erscheinen, ihre Maschinen kostbare Schätze. Zu Hause dann habe ich die Türe der Abstellkammer geöffnet. Statt den Vorräten schlängelten und drängelten sich dicke schwarze Kabel aneinander und vorbei durch die Wände in die anderen Wohnungen. Ich fuhr mit den Fingern über die Schleuche, es kitzelte auf den Häärchen meiner Unterarme, kleine Schläge, die Elektroden schwirren mir um die Ohren, ich bade in unsichtbaren Stromwellen und erwache plötzlich, verschwitzt und aufgeregt.", "Meine Nachbarn verheizen den Parkettboden um ihre Hauskatzen über dem Feuer für ein Essen zu braten. Wir haben jetzt gar keinen Strom mehr. Nach dem letzten Ausfall wusste ich sofort, dass er nicht wieder eingeschaltet werden würde. Wie Fischherzen auf Ufersteinen, zucken die Frequenzen weiter durch die Geräte, bis ihr sachtes Surren irgendwann verstummt. Meine Ohren wechselten in einen anderen Seinsmodus, als hätte ich einen Höhenunterschied rasch überwunden.", "Keine zwei Wochen ohne Strom und die Menschen in meinem Areal beginnen immer seltsamere Verhaltensweisen an den Tag zu legen. Abends fanden sie sich zusammen, an Kreuzungen, oder in den Parks, um die Schleierformationen die unterhalb der Plane hängen zu deuten und ihre Wellenschläge zu interpretieren. Dann werden die Zusammenkünfte von mehr als drei Personen verboten. Jetzt streunen sie einzeln, zu zweit, oder dritt durch die Straßen, auf der Suche nach einem leichten Gefühl. Begegnen sich Bekannte tauschen sie seltsame Gesten, halten kurz inne, schauen nach oben, die Plane schlägt Wellen, schauen sich wieder an ohne Worte, zwinkern sich zu, meist drei Mal zugleich, fest mit beiden Lidern, nicken und setzen ihren Gang fort. Wie Gesichter im Schlaf die Geschäfte, ihre Türen geschlossene Augen. Geschlossene Lider die Rollläden der Lokale. Gardinen, Molton, Abdeckungen aus Platten und Karton an den Fenstern schützen vor Blicken. Manchmal blitzen Gelenke, Kleidung, befüllte Gläser durch Spalten und lassen, wie das Zucken schlafender Körper die Träume, heimliche Zusammenkünfte erahnen. Ich habe keinen Zugang zu diesen Treffen, auch der Zeichenausstausch in den Straßen bleibt mir verschlüsselt. Er kurz bevor die Bewegungsfreiheit in der Stadt eingeschränkt wurde, bin ich in dieses Areal gezogen, ich kenne kaum Menschen und meinen Nachbar*innen bin ich wegen meiner Beziehung zu Sascha und der Tätigkeit in den Hallen suspekt.", "In den Tagen ohne Dienste wate ich in meiner Wohnung unter einer Glocke aus Zeitlosigkeit. Ich schiebe die Stunden weg, mühsam, eine nach der anderen, in der Hoffnung am Ende Platz für irgendetwas Sinnvolles geschaffen zu haben, ohne zu wissen, was das sein könnte. Ich öffne den Kühlschrank, das Essen ist tot, der Eisbergsalat feuchtelt unter dem Plastik. Das Geräusch der Gemüselade mochte ich nie, aber ich dachte schon länger daran, eine Schildkröte hineinzugeben. Ich lege Vorräte an die nicht gekühlt werden müssen. Rote, gelbe, braune und schwarze Linsen. Später sagst du: Ich liebe deinen Linsensalat. Und: Du musst hier weg.", "Ich bekomme keine Genehmigung mehr für das Areal in dem du wohnst, du musst dich jedes Mal aufwendig registrieren. Der Weg zu mir macht dir Angst. Wir sehen uns weniger. Durch deine Beziehungen würde ich sofort eine Wohnung im anderen Areal bekommen. Ich zögere noch. Wir kennen uns kaum. Meine Empfindungen suchen einen Ausdruck und finden nur Worte, die schlecht sitzen, aus billigem Material, das mir auf der Haut kratzt und unter dem sie schwitzen und stinken und ich schäme mich, sie überhaupt ausgewählt und angezogen zu haben. Ich spüre ein Brennen und fahre über die Wölbung an den Innenseiten meiner Handgelenke. Wie Spinnbeine gehen tasten wir uns in die Nähe, Blicke spuren Ritzen ins Gedankeneis mit Schlittschuhkanten Kringelbahnen Heiterkeit und blattzittrig im Wald durchs Beckengehänge. Nächste Woche willst du mich vorstellen.", "Lege Hände an Hirnwände, schiebe sie auseinander, greife hinein, knete, forme, forme Früheres zu Gestalten, die wir in der Wohnung aufstellen, anschauen, hernehmen, um mit ihnen zu spielen, nachspielen, wann immer wir wollen.", "Erinnerungen drängen, sie schieben, sie stemmen, sie bohren gegen den Traumstein in der Nacht, aber nichts kommt durch. Ich schaue mir eine Doku an und lasse meine Hand zur Beruhigung in einem Beutel bunter Knöpfe versinken. Der Beutel begleitet mich wohin auch immer und immer fühlen sich die Knöpfe kalt an und knattern wenn ich mit den Fingern kraule. Ich werfe einen Blick aufs Telefon, viele Anrufe in Abwesenheit.", "Die Signale der Anlagen blinken tagein tagaus, in der Nacht und am Tag. Wenn vor der Frühe die Sonne gravid sich über den Planenrand hievt, bohren sich ihre Strahlen durch die Plane und fallen dumpf auf ihre Rohre. Dann öffnet die neue Schicht wieder die Tore, während hinten bei den Haufen das Feuer schon brennt. Jede Nacht sterben Menschen in den Anlagen. Die Schwaden zeigen es an. Wir wissen es.", "Plötzlich höre ich einen Gesang, mehrstimmig, langsam, ich kann keine Worte verstehen. Als ob der Gesang direkt in meinen Ohrmuscheln hocken würde, als wäre mein eigener Körper ein Hohlraum, ein endloses Kirchenschiff, Choräle vervielfachen sich und in diesem Gesang ist alles enthalten. Alles was war und alles was ist und alles was sein wird.", "“Wo bin ich?”", "“Los!”", "„Über die Plane kann ich nichts schreiben, das sage ich gleich.“", "“Los jetzt!”", "SASCHA", "Aus der Flugzeugferne funkelt die Plane über der Stadt wie ein Diamant. Vor der Landung werden die Fenster verdunkelt. Am Boden trennen mich Sicherheitsmenschen von den anderen Passagieren und führen mich gesondert zum Schleusbereich. Die Prozedur dauert zwei Tage. Ich verbringe einen Tag in endlosem Schwarz. Am nächsten Tag werde ich von einem Fahrer in eine der Hallen zum medizinischen Check-up gebracht.", "Wir fahren über das Gelände der Anlage, durch getöntes Fensterglas sehe ich die Signale der Anlage auf den Hallendächern leuchten, Rauschschwaden fließen aus den Rohren in die dunstige Dämmerung. Das Metall der Rohre glitzert, windet sich in undurchschaubaren Rundungen zu Verläufen, die sich wie von selbst ergeben. Fügungen. Über Fügungen denkt mein Vater gerne nach. Ich drehe meinen Kopf und treffe im Rückspiegel auf den Blick des Fahrers. Die Anlage werde immer größer, die Produktion in den Hallen immer schneller. Seine Stümme schlängelt sich stolz auf, an den Satzenden, wie eine züngelnde Schlange, vor der ich zurückweichen muss, ich presse mich in den Ledersitz, das knartscht. Er hat seine dünnen Lippen zu einem Grinsen verzogen. Ich weiß nicht was er über mich weiß, aber wahrscheinlich weiß er zumindest wer ich bin. Ich lasse das Autofensterglas runter und zünde mir eine Zigarette an. Der Fahrer weist mich nicht zurecht. Der Fahrtwind fegt der Zigarette die Asche sofort vom Stängel. Der Luftdruck macht mir zu schaffen.", "Sie sagen, ich sei bereit.", "Als ich aufwache, fühle ich mich irgendwie gut. Ich streiche über die leichte Wölbung an der Innenseite meiner Handfläche, dann suche ich in den sanften Augen einer medizinischen Fachperson nach Antworten. „Es geschieht schleichend. Sie verblassen langsam, zuerst die frischen, dann die älteren“, erklärt sie mir, ohne dass ich meine Furcht in Worte gefasst hätte.", "Ich bestehe darauf mit öffentlichen Verkehrsmitteln in die Stadt zu fahren. Sie halten Rücksprache mit meinem Vater, er genehmigt.", "Von meiner Vergangenheit mit der Stadt blieb der vertraute Klang der U-bahn, mein Sitznachbar strahlt die Gutmütigkeit eines Entengesichts aus, eine Gruppe Kinder steigt ein, ich spechtle auf das Telefon der Person neben mir, um die Nachrichten ihrer Freund*innen zu lesen, die mir die meinen nicht mehr schreiben können. Die Kinder schauen mir geradewegs in die Augen. Sie starren mich durchdringend an. Eins, zwei, drei, die Angst geht gleich vorbei. Zwei Menschen in Arbeitskostümen sprechen über die Sonnenstürme. Der Notstrom reiche für die Klimaanlagen nicht.", "Wir riechen, wir rinnen, frösteln hell, Herzen schlagen schnell, aber die Hitze senkt den Puls der Sekunden. Die U-Bahn hält, Die Kinder schmieren sich durch die Schiebetüren, unsere Ausdünstungen vermischen sich in der luftarmen U-Bahn. Die Unterschiede lösen sich in der Schweißgemeinschaft auf. Ich steige aus und tauche in mir bekannten Straßenfluchten ab. Die schwarzen Flecken alter Kaugummis auf grauem Asphalt sind unser Sternenhimmel jetzt, Rollkofferräder gleiten widerstandslos über den glatten Untergrund.", "Mein Blick klettert an der Glaswand des Einkaufszentrums vor mir hoch, streift die Kante des Hochhauses, ich blinzle, oben steht eine Gruppe Kinder und winkt, mein Blick wandert wieder zurück, ich schaue in die Gesichter der Anderen in den Straßen. Die Polarlichter sickern durch die Plane und färben unsere Profile grün. Wann werde ich wieder einen Himmel sehen?", "„Sie schießen.“", "„Jetzt sind wir wieder vereint.“", "„Sie schießen an den Schleusen.“", "„Uns geht es nichts an, einmal ging es von uns aus, aber das bevor du auf der Welt warst.“", "Ich schaue ihn nicht an, ich höre nur sein Schnaufen. Die Hallen laufen. Sie laufen besser als je zuvor. Er bekommt immer mehr Ansehen, während sein eigenes verfällt. Eine jedes Glied in den Hallen muss seinen Teil beitragen, damit das Ganze funktioniert. Wir sitzen in der Zentrale und schauen fern. Im anderen Land reißt das Wasser die Liegestühle und Sonnenschirme mit sich. Mein Körper zieht sich zusammen. Meine Hände zittern. Die Hände meiner Schwestern zittern, die Flasche schlägt an die Kristallgläser, während die Jüngste uns nachschenkt. Ihn habe ich noch immer nicht angeschaut. Der Whiskey legt sich auf die Geschmacksknospen meiner Zunge wie Samtvorhänge die früher schwer vor Eingangstüren hingen um gelblichtige Gespräche in Lokalen vor der Witterung zu schützen.", "„Du musst dich entscheiden.“", "Ich kann nicht sprechen.", "Als ich ins andere Land ging, klebten sie mir auf den Fersen. Ich betrat die Ankunftshalle, in der niemand auf mich wartete, nur sie warteten darauf, endlich aus meinen Schuhen zu steigen, zum Beispiel auf den flauschigen Hotelteppichboden. Dort lag ich dann und fühlte mich weniger einsam, als im Doppelbett. Einmal in der Woche ging ich in das Geschäft mit den Fischen, zog meine Schuhe aus, meine Strümpfe und hielt die Füße in das Becken, damit die Fische sie mir von den Fersen fressen. Woche für Woche stand ich in der Halle am Geländer, mit kribbelnden Sohlen. Von oben sah ich nur Scheitel und Hände. Am Abend trank ich mit den anderen, die zum Arbeiten gekommen waren darauf, dass die Arbeitszeit vorüber war, für ein paar Stunden, bis sie wieder beginnen würde die Sekunden in die Unbestimmtheit zu schlagen. In der Nacht sank ich in den Schlaf, in dem keine Sekunden schlugen, nur mein Herz.", "Meine Kleidung roch noch nach zu Hause, während die einzelnen Stoffstücke unter mir zu einem Kleidungsstück wurden, nach dem Plan, den ich entworfen hatte. In ein paar Tagen würden die Kleidungspakete in das Land, aus dem ich gerade gekommen war, zurückfliegen, den Geruch der Fabrik ablegen und jenen irgendwelcher Körper und irgendwelcher Wohnungen annehmen.", "Ich kannte die Namen der Arbeiterinnen unter mir nicht. Ich kannte ihre Geschichten nicht, nicht ihre Gesichter. Vom Geländer aus sah ich nur Scheitel und Hände. Die Hände, die die Stoffstücke zur Kleidung verarbeiteten und jene, die sie sich über die Körper zogen, werden sich nie berühren.", "Rot im Tausendweiß der Fabrikshalle. Eine Nähmaschinennadel landete in einer Hand statt im Stoff. Drei Uniformierte trugen die Frau hinaus. Die Nadeln ratterten, die Arbeiterinnen verharrten Die Männer schrien. Die Frauen starrten. Die Männer schlugen die Frauen mit einer Holzstange. Die Frauen arbeiteten weiter. Mein Vorsatz löste die Umklammerung meiner Finger vom Geländer, ich ging ins Büro des Hallenkoordinators und kam mit einer Gehaltserhöhung wieder heraus. Am Abend zog ich einen schwarzen Strich unter meine Lid, das Haar durch das Glätteeisen und weiße Lines durch die Nase", "Ein paar Wochen später brannte die Halle ab, fast alle Arbeiterinnen starben. Von der Leitungsebene war niemand im Gebäude.", "Ich nannte dem Fahrer den Namen der Gegend, wo das Wasser kommen wird. Ein paar Menschen nageln Holzbretter über die Fenster ihrer Geschäfte und hieven Dinge auf Karren. Sie machen sich auf. Das Wasser kommt übermorgen. Ich sage dem Fahrer, dass er halten soll, in der Sprache, die ich nie gelernt habe. Ich gebe ihm Geld, er wünscht mir Glück. Ich gehe zum Wasser. Die Liegestühle und Sonnenschirme warten auf Menschen. Es werden keine mehr kommen. Nur das Wasser wird kommen. Ich grabe meine Fersen in den Sand. Hinter mir plündern welche ein Lokal. Sechs Monatslöhne habe ich für das Flugticket ausgegeben.", "„Du musst dich entscheiden.“ Er schaut mich durchdringend an. Seine Augen treten immer stärker hervor, wie Ballone schwellen sie an, bald werden sie platzen, denke ich, die schwarze Ballonhaut wird reißen, ihr Inneres wird über seine Lider quellen, die schwarzen Lachen werden über sein weißes Schweißgesicht tränen, von seinem Körper tropfen, den Teppichboden tränken, bis zur Couch auf der ich mit meinen Schwestern sitze fließen, unter den Ritzen der Türen hinaus auf den Gang in die anderen Büros hinein, durch die Glasverkleidung des Hochhauses werden sie nach draußen dringen, die Stockwerke des Gebäudes hinunterrinnen, auf den Asphalt und vom Vorplatz aus sich ausbreiten, in alle Bezirke, über alle Dinge sich legen, die ganze Stadt werden sie aufsaugen, in sich aufnehmen und alles, alles wird im Schwarz seiner Augen verschwinden.", "Seine Trommelschlegelfinger prasseln auf den Glastisch. Ich entschuldige mich aufs WC, lasse kaltes Wasser über die Innenseiten meiner Handgelenke laufen und suche die vergangenen Jahre im Spiegelbild. Die Erinnerungen schnuppen wie Sterne durch den Augenblick, aber kaum nehme ich sie war, verschwinden sie schon wieder. Bald wird auch das nicht mehr passieren. Also beschließe ich sie aufzuschreiben.", "Ich liege auf einer Decke im Gras und strecke die Füße senkrecht in die Luft. Zwischen den Grashalmen sehe, höre und spüre ich Ameisen krabbeln. Ich habe noch keine Vorstellung davon, wo mein Körper anfängt und wo er aufhört. Wenn ich mich selbst in den Arm zwicke, spüre ich etwas, wenn ich in den Arm meines Vaters zwicke, spüre ich auch etwas, aber es fühlt sich anders an. Jetzt spüre ich ein Kribbeln auf meinen Armen. Die Ameisen sind von den Grashalmen auf meine Arme gekrabbelt. Es fühlt sich anders an. Ich bin zwölf Monate alt. Ich denke in Empfindungen die Sinneswahrnehmungen auslösen. Jetzt höre ich wieder dieses Rauschen über mir. Mein Körper zieht sich kaum merklich zusammen, ich reiße die Augen auf, meine Beine strampeln in der Luft. Diffuse Angst artikuliere ich immer noch körperlich. Sie ist es, die meine Beine einen Schritt vor den nächsten setzen lässt, ins andere Land, die Flugzeugtreppen hinauf. Nur statt der Beine strampeln jetzt meine Worte strampeln, im Versuch dieses bedrohliche Gefühl als solches überhaupt zu begreifen.", "Im Nachbarland war Krieg. Die Flieger flogen über die Felder auf denen ich als Kind im Gras lag. Die Grenze war nah. Vielleicht war der Schmetterling, den ich auf einer Blume aufflattern sah, auf der anderen Seite gewesen. Vielleicht lag jetzt ein toter Körper auf der Blume, die vor ein paar Stunden noch süße Nahrung für den Schmetterling war.", "Das alles wusste ich damals natürlich nicht, aber vielleicht spürte ich es irgendwie. Das Rauschen der Bomber unterscheidet sich nicht markant von dem Rauschen eines vorbeifahrenden Zuges, oder dem der Flüsse. Die Rede der Erwachsenen verstummte, sie richteten ihre Blicke nach oben zum Bomber, dann schauten sie sich untereinander an. Nach einem kurzen Augenblick des Innehaltens, suchte jeder rasch eine Beschäftigung zu finden. Ich fing wieder zu weinen an.", "Die Bilder flackern am Screen, sie tunken Sushi in Sauce und ich sehe meine Großmutter während unserer seltenen Besuchen vor mir, wie sie süßes Brot in Malzkaffee taucht, um es in ihrem Mundraum zergehen zu lassen wie patzigen Schnee. Hier werde er die Anlage bauen sagte er damals, als über die Felder gingen, zuerst er, dann meine zwei Schwestern und ich, die Mutter zum Schluss. Schüsse. Sie galten nicht uns. Damals hatte er auch ein Gewehr im Schrank. Ein paar Mal war ich mit ihm in die Wälder gegangen.", "“Ich schieß´ dir eins.”", "Wie sehr er damals noch Körper war, denke ich jetzt. Am Nachmittag soll ich die Anlage besichtigen. Hinter den Hallen steigt Rauch auf. Ich spreche die Gerüchte an. Wie erwartet: Schweigen.", "Die ersten Wochen nach meiner Ankunft verbringe ich in der Villa meines Vaters vor den Screens. Ich schlafe viel. Wenn ich nicht schlafe, bin ich damit beschäftigt meiner Schwester auszuweichen. Sie erwischt mich trotzdem. Dann lege ich ihr knappe Antworten auf ihren Präsentierteller, sie leckt ihn langsam und zufrieden auf, wischt sich mit dem Handgelenk über die dünnen Lippen, haut endlich ab und ich verheddere mich erneut im Netz aus Bildern, im Versuch irgendetwas Vertrautes wiederzufinden. Ich tippe den Namen der Stadt in der ich gelebt habe in die Suchmaschine, sehe sogar Bekanntes, sehe was ich noch vor kurzem mit eigenen Augen sah, aber nichts verbindet sich mit einem Gefühl. Als wären meine Augen taub. Ich klappe den Laptop zu, die Bilder flimmern stumm auf der Rückseite meiner Augen weiter. Ich setze mich auf den Boden, schließe die Augen und versuche die Bilder von der Rückseite auf die Vorderseite zu holen, damit sie mir die Tränen aus den Augen, aus dem Körper drücken, weil mir sonst meine Worte ertrinken.", "Dann lernte ich Renata kennen.", "Der Patriarch ist rotwangert, im Sommer, im Winter, in der Früh und am Abend. Das habe ich Renate vor dem ersten Kennenlernen erzählt, sie wollte auch gar mehr wissen, zumindest hat sie nicht nachgefragt. Mittlerweile war sie ihm ohnehin nähergekommen, als sie jemals gedacht, oder gewollt hatte. Ich schaue ihn noch immer nicht an, ich starre lieber über ihn hinweg auf das großformatige Portrait meiner Vorfahren an der Wand hinter ihm. Dass er mit einer Lässigkeit im Sessel sitze, sagte sie, wie Menschen, die eben nicht einfach nur auf Möbeln sitzen, sondern sie besitzen.", "Als ich ihre Wohnung betrete, ist Renata schon arbeiten gegangen. Ich zünde eine Kerze an, setze mich und lasse das Wachs auf den Tisch tropfen bis die ganze Kerze zu einer Schicht geronnen ist. Mit dem Zeigefinger streiche ich über die Fläche und forme es zu einem Rechteck. Mit dem Essmesser, an dem noch Butterreste von Renatas Abendessen haften, ritze ich ein paar Buchstaben in die Wachsschicht. An der Kerbe des eingeritzten Zeichens perlt Wachs wie Meersalz raschelt in der Kuhle eines Küstenfels, in das meine Mutter während unseres letzten gemeinsamen Urlaubs ihre Finger taucht und mir die Rückstände der Wellen zeigt, Crusheis, denke ich, ohne damals das Wort dafür zu haben, das Bild brennt in meinem Brustkorb, die Knospen an den Innenseiten meiner Handgelenke vibrieren und ich spüre das Messer in meiner Hand heiß werden, es fällt aus meiner Hand auf den Tisch.", "Ich stehe auf und trinke ein Glas Rum. Wie die Bernsteinkettenkugeln um den fleischwulstigen Hals meiner neugeborenen Schwester sich perlten, tropft er meine Kehle hinunter. Rum-Kokos von Casali, denke ich und trinke mich in einen Werbekörper auf einer Insel hinein, aber dann ploppt die Erinnerung an den Wunsch meine kleine Schwester mit ihrer Bernsteinkette zu strangulieren auf und ich erschrecke über den erstickten Babykopf der das Bild des Greisengesichts Großvaters nach sich zieht, rund, rot, haarlos und das meiner Großmutter wie sie über mich drüber ihm ins Gesicht grabscht, seine Nase zuhält, bis das Aufschnappen sein Schnarchen unterbricht. Zwischen die alternden Körper die Enkelkinder gelegt, in der Nacht die jungen Jahre abzuzwacken um von den ihrigen zu subtrahieren, denke ich jetzt.", "Mittlerweile sind mehrere Areale ohne Strom und die Internetkommunikation in jenen, die noch welchen haben wird von Tag zu Tag nutzloser. Mein Maileingang ist ein Heuhaufen und die Suche nach einer relevanten Nachricht gleicht der einer Nadel. Auch die Programme meines Vaters schaffen es nicht mehr, die relevanten Nachrichten auszusortieren. Er hat eine ganze Abteilung damit beauftragt die Posteingänge nach relevanten Nachrichten zu durchforsten, inzwischen ist die Plage auf die Mobiltelefone übergesprungen.", "Renata ist jetzt seit zwei Wochen verschwunden. Ich habe nichts mehr von ihr gelesen, gehört, sie ist seitdem nicht mehr in ihrer Wohnung aufgetaucht, scheinbar hat sie auch seit zwei Wochen keinen Dienst mehr in der Halle angetreten. Ich stelle mir ihren Körper vor, wünsche mir in ihn hineinzukriechen und völlig in ihm aufgehoben zu sein. Meine Erinnerungen werden immer blasser. Es klopft an der Tür, eine Botin überreicht mir ein Zettelchen:", "Sascha entfaltet das Blatt. Es ist wieder eine Nachricht der Botinnen. Lange dachte sie, dass sie Nachrichten von außerhalb bringen würden, dabei sind es einfache Mitteilungen zwischen den verschiedenen Gebieten der Stadt", "Seltsam, denkt Sascha, dass sie sich durch diese Seite Papier Han näher als je zuvor fühlt. Nie hatte sie über irgendetwas gesprochen, was länger zurücklag als ein paar Wochen. Die Vergangenheit verlieh ihr eine Dreidimensionalität, zumindest in Saschas Vorstellung von Han und ihre Gegenwart erscheint ihr plötzlich eine Kulisse aus Pappe in der die Mitmenschen und sie selbst wie Puppen, oder Scherenschnitte in zackigen Bewegungen durch den Tag stocken. Die Knospe ihrer Handinnenfläche beginnt zu brennen, als hätte sie einen verbotenen Gedanken gesponnen. Hat sie etwa? Sie schnauft auf und schenkt sich kaltes Soda in ihr Glas, um die Schwüle in ihrer Wohnung zu vertreiben. Seit dem letzten Sonnensturm muss sogar ihr Gebiet mit Sauerstoff sparen. Die Anzeige ihres Messgeräts lungert seit Tagen im unteren Drittel, wie Schülerinnen an einer Haltestelle lustlos und faul auf den Bus warten, der sie nach Hause bringt, wo derselbe öde Nachmittag auf sie wartet, wie schon an den Tagen davor.", "Es war nicht so, dass sie alles vergessen hatte, aber die Erinnerungen flattern nebenbei durch den Tag, ohne sich an eine Empfindung, oder ein Gefühl zu hängen, wie am herumliegende, gebrauchte zerknüllte Taschentücher, die etwas Ekel erregten, oder zumindest das Bedürfnis weckten, sie rasch zu entsorgen, wie lästige Fliegen, die manchmal näher, manchmal ferner durch die Schwüle surren, oder das Flimmern von Hitze im Mittagslicht über dem Asphalt, dass das Schauen durchwellt und die Umgebung kurzeitig flattern lässt, ohne irgendetwas an ihr zu wandeln. Die Erinnerungen blieben blass. Für Phantasien oder Tagträume waren sie zu schwach und natürlich auch für die Träume. Nur die Körper erinnern sich. Die Geschichte der Mitmenschen ist in ihren Gesten, Haltungen, im Zucken gewisser Gesichtsmuskeln, Gangarten, Stimmhebungen, ja vor allem in der Sprache selbst und nicht in ihren Inhalten. Sie befand sich in der Art und Weise wie sie Worte färben, Vokale langziehen, oder kürzen, Konsonanten verschlucken, Sätze ausschmücken, mit Füllwörtern zumüllen, Verzögerungslauten hinauszögern, unterbrechen und beenden.", "Immer wieder schiebe ich mich in Siers hinein, lege Teile meines Ichs in ihr Inneres, um mit ihr zu gehen, durch die Stadt, in das andere Land, oder in das Dorf, dieses Herz der Finsternis, in das zurück zu kehren anscheinend notwendig ist. Als hielte dieser dunkle, unscharfe Ort die Farben bereit, um eine Erzählung zu malen, Worte, um den Ort auszumalen, ich meine, heraus zu schreiben und ihn in den Bildern einzufrieren. Was in diesem Dorf wartet, wenn wir zurückkehren, weiß ich nie. Die Einsamkeit zu kartographieren bleibt ein ungewisses Unterfangen.", "Im Zentrum der Stadt hocken die Kinder in den Bäumen gegenüber der Zentralen. Sie haben die Kalaschnikovs geschultert und auf den Ästen abgestützt. Ihre Körper sind noch zu klein und zu schwach, um das Gewicht alleine tragen zu können. Sie beginnen mit dem Beschuss. Die Menschen verharren im Inneren der Gebäude. Jene, die schon groß genug sind, um die Waffen alleine halten zu können marschieren über den Platz und gehen in die Zentralen. Sie töten alle.", "Kinder sind draußen. Sie haben kein Inneres. Manchmal stülpen die Erwachsenen ihr Inneres nach außen, aber das ist etwas Anderes. Mein Inneres hat sich von der Umwelt zurückgezogen, auch wenn es mit ihr in Kontakt steht. Damit kam auch die Einsamkeit. Die Einsamkeit gehört niemandem, deswegen ist sie unteilbar, aber sie trennt die Menschen von den Dingen und voneinander. In Gedanken begreife ich, dass sie nicht mir allein gehört, aber glauben kann ich das nicht. Wenn die Worte durch die Gleichzeitigkeit rasen, verkehrt sich die Einsamkeit in etwas Anderes, vielleicht in ihr Gegenteil? Eine Totalität, in der jede Frage fehlt, der Zweifel verschwindet und alle Möglichkeiten nebeneinander existieren.", "Ich drehe mich auf die Seite. Meine Gedanken laden sich wieder mit Gefühlen auf, wie draußen die Hitze mit Feuchtigkeit. Ich werde gehen müssen. Viele meiner Freunde und Freundinnen haben sich schon vor Monaten gemeldet. Gezweig in meinen Ohren. Ich weine. Über die ewigen Felder sind wir gegangen, bis wir fast nicht mehr konnten. Ich habe vergessen, wie Vögel zwitschern. Der Wald atmet uns ein. Tau. Ich spreche es aus, kein Wort, ein Geheimnis.", "MOSH", "Ich sitze im Zug. Ich fahre in den Süden. Vor ihm strickte eine Frau. Die Reisenden packten ihre Wurstbrote aus. Das Knistern der Stricknadeln, das Knistern der Alufolien juckten ihm in den Ohren. Peter roch die Schweißlaken unter den Achselfalten seiner Sitznachbarin.", "Er trank ein Bier das ihn nicht müde machte. Im Zugfensterglas, das niemand öffnen konnte, sah er sein Gesicht von den Knochen fließen. Dahinter war Wald und November.", "Damals gab es noch einen November.", "Ein Kind schrie. Die Reisenden aßen ihre Jause. Niemals hatte er gedacht, sich über die Ankunft im Süden zu freuen. Sein Rücken schmerzte. Er dachte an die unbequemen Kirchenbänke seiner Kindheit.", "Peters Stiefmutter war Leichenschminkerin und jetzt war sie tot. In den letzten Jahren hatte sie viel zu tun gehabt. Sie ist noch einmal aufgeblüht. Als sie ins Haus kam, stickte sie seinen Namen auf Leinen. Peter stand in der Stube und schaute ihr zu. Das Metall der Nadel silberte ihm in den Augen. Er blinzelte.", "</w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/><w:t xml:space=\"preserve\"> </w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/><w:t>„Deine Aussteuer.“", "Hinter dem Fenster schmolz die Kontur der Bergkette in den Abend.", "Peter dachte an die Hände seiner Mutter.", "</w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/><w:t xml:space=\"preserve\">", "</w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/><w:t xml:space=\"preserve\"> <w:t>„Ich hätte da noch eine zum Heiraten.“", "Keine Ahnung, ob Peter jemals verstanden hat, dass seine Mutter tot war. Han sagte einmal zu mir, dass mich eine Stille, wie eine Sehnsucht ausfüllt, für die es keine Worte gibt und das ich hinter ihr verschwinde.", "Peter sah wie die groben Hände der unbekannten Frau, den Körper seiner Mutter wuschen, einschmierten, schminkten. Jenen Körper der ihm einmal nah und in den letzten Jahren fremd geworden war. Er legte die Hände übereinander. Seine Fingernägel schnitten dünne Halbmonde in seine Haut. Die unbekannte Frau war in diesem Augenblick zu seiner Stiefmutter geworden. Blut tropfte auf das Leinen. Die Stiefmutter fluchte.", "</w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/><w:t xml:space=\"preserve\"> <w:t>„Auf ihre Stumpen passt kein Fingerhut“", "Die Sitznachbarin im Zug lachte ins Telefon. Ihr in Rollen gelegtes Bauchfett hob und sank sich. Die Oberarme der Strickerin vor ihm bewegten sich auf und ab, wie beim Vogeltanz. Am Faschingsball erlebte Peter seinen Vater immer betrunken. Nach dem Tot der Mutter erlebte er seinen Vater an jedem Besuch betrunken. Den Entschluss zu gehen fasste Peter an dem Abend in der Stube, als die Stiefmutter seinen Namen in das Leinen stickte und ihr Blut auf Leinen tropfte.", "In der Stadt schnitt er sich mit einer Rasierklinge dünne Halbmonde in die Haut. Der Arzt versteckte die Blutmonde unter einem Verband und gab ihm ein Medikament, das er in den nächsten Mistkübel schmiss.", "</w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/><w:t xml:space=\"preserve\"> </w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/></w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/><w:t>„Für die Nerven“", "Peter dachte an die Hände seiner Mutter.", "Wenn im Herbst die Sonnenstrahlen, durch die Atmosphäre brachen, leuchtete der Mond orangerot. Die Menschen im Dorf nannten ihn Erntemond. Er spendete den Bauern Licht, damit sie bis spät in der Nacht die Felder bearbeiten konnten. Bevor der Arzt die Hände einfaschte, saß Peter lange in der Küche seiner Stadtwohnung. Seine Wohnung war klein, feucht und kalt.", "Die Halbmonde auf seinen Händen pochten.", "Einmal hockte er mit seiner Mutter am Feld, zum Erntemond und zog mit ihr das Gemüse aus der Erde. Die Mutter besserte bei einem Bauern des Dorfes das Familieneinkommen auf. Dieses Jahr bat sie Peter, ihr zu helfen. Er hatte noch nicht bemerkt, wie schwach sie schon geworden war. Als sie am Feld zusammenbrach, drückte sie seine Hand. Es war ihr letzter Erntemond. Sie schaute den Mond an, dann zog sie Peter zu sich. Er weinte an ihrer Brust. Zumindest wünsche ich ihm diesen Augenblick der Nähe.", "</w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/><w:t xml:space=\"preserve\"> <w:t>“In der Erinnerung liegt die Gegenwart.“", "Peter nahm die Verbände von den Händen. Er legte seine Hände auf den Küchentisch. Dann legte er seinen Kopf auf die Hände und sah durch das Küchenfenster ein, zwei Vögel in der blätterlosen Baumkrone hocken. Früher waren sie in den Süden geflogen, wenn der Winter kam.", "Damals gab es noch einen Winter.", "Er ging aus der Wohnung und kaufte sich eine Kamera.", "Fortan hielt er den Apparat in seinen Händen.", "Bei jedem Besuch wurden ihm die Brüder fremder, der Vater stummer und er wurde zu einem Gast. Sein zu Hause war jetzt woanders. Oder er hatte keines mehr.", "</w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/><w:t xml:space=\"preserve\"> <w:t>„Ich hätte da noch eine zum Heiraten“", "Die Stiefmutter nannte ihn jetzt „mei Bua“: Vor seinen Augen sah er sie den Schenkelstipfel seines Vaters bearbeiten, auf dieselbe Weise, wie sie das Gemüse aus der Erde zog.", "Peter dachte an die Hände seiner Mutter.", "Britta sah er zum ersten Mal auf der Doppelhochzeit seiner Brüder. Sie war die erste Enkelin der Stiefmutter und die letzte unverheiratete. Seine Brüder heirateten die anderen zwei. Fügung, sagten die Menschen im Dorf. Die älteste Enkelin gestikulierte, wenn sie sprach, wie ein auf dem Rücken liegender Käfer. In ihrem Achselhaar glitzerten die Salzkristalle ihres Schweißes. Die zweitälteste Enkelin sprach viel, aber monoton. Aus dem Muttermal oberhalb des Mundes sprossen Halme, Haar hatte sie schütteres.", "Der Zug lehnte sich in die engen Kurven des Tales. Ich glaube Peter musste unebdingt an die frische Luft. Er lehnte sich mit dem Oberkörper nach vorne, schützte mit seinen Händen die Ohren. Das Knistern war ihm endlos.", "Vielleicht wünschte sich Peter, Britta beim Begräbnis wieder zu sehen. Ich weiß was aus ihr geworden war. Peter wusste es noch nicht.", "</w:r><w:r w:rsidRPr=\"00717A0F\"><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:eastAsia=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:cs=\"Times New Roman\"/><w:color w:val=\"000000\"/><w:kern w:val=\"0\"/><w:lang w:eastAsia=\"de-DE\"/><w14:ligatures w14:val=\"none\"/></w:rPr><w:tab/><w:t xml:space=\"preserve\"> <w:t>„Wer schminkt jetzt die Stiefmutter?“", "Der Zug fährt in den Bahnhof ein.", "Der Mutter hat Peter noch einmal seine Lippen an die blutleeren Wangen gelegt, bevor sie starb. Zumindest wünsche ich ihm diesen Augenblick einer Nähe. Die Stiefmutter küsste er lieber tot als lebendig.", "Meine Mutter spielte unter dem Totenbett von Peters Stiefmutter mit den anderen Kindern vom Dorf „Verstecken“, bis man sie in die Stube zerrte. Dort weichte der Schnaps den Trauernden den Kloß der Betroffenheit auf. Die Kinder tunkten Weißbrot in Malzkaffe. Aus dem Totenzimmer war tagein, tagaus ein Teppich aus Gebeten zu hören.", "So hat es mir zumindest meine Mutter erzählt. An Peter kann sie sich nicht erinnern. Das Ritual gibt es nicht mehr. Vielleicht fehlt es mir, um zu begreifen, dass die Toten tot sind und mich nicht mit ihrem Sterben anstecken, wie die neuen Tiere mit ihren neuen Viren, die vor ein paar Monaten ins Land gekommen sind.", "An der Grenze zur Zwischenstadt wurde wieder geschossen. Zwei Körper liegen am Asphalt. Wer nicht schießen will, wird erschossen und wer für die Falschen schießt auch. Euch geht es nichts an. Von Euch ging es einmal aus, aber das war, bevor wir auf der Welt waren. Jetzt schießen die anderen. In der Nacht, zittern eure Hände. Jene, die nicht am Asphalt liegen, die es geschafft haben, sie sitzen in der Nacht am Feuer. Sie sprechen mit den Augen. Wenn Neue kommen, halten sie sich an den Händen und säuseln. Mit ausgestreckten Armen und geöffneten Handflächen sind sie gekommen und mit dem Schrecken im Gesicht.", "<w:t xml:space=\"preserve\"> <w:t>„Ihr seid da.“", "Das sei alles was zählt, sagt Eine, die schon länger da ist. Ihre Augen lächeln. Sie legt den Neuen die Hand auf ihre Schultern und führt sie zu den anderen, die um die Tonnen hocken. Zwei, drei stellen sich an die Tonne.", "<w:t> „Nur eine Fingerkuppe“", "wird ihnen gedeutet, die anderen Finger zur Faust krümmen, dann die zweite, dritte, vierte, fünfte, sechste, siebente, achte, neunte, zehnte Fingerkuppe. Im Gesicht der Neuen weicht der Schreck, dem Schmerz. Das Säuseln begleitet das Schmelzen der Haut, das Knistern, das Zischen der Identität, die von den Fingerkuppen in die Flammen fließt. Wenn der Morgen hereinbricht, fallen die letzten von den Neuen in einen tiefen Schlaf. Die anderen treten den Weg an, um ihre Körper der Arbeit in den Hallen zur Verfügung zu stellen. In den Containern hinter den Hallen krümmen sich die Körper in den Schlaf. Häute kleben an schwarzem Belag, sie kleben an anderen Gliedern. Die Körper schlafen nackt. Jeden Abend stehen sie vor den Türen der Container, reißen sich die Gewänder von den Körpern, mit Zähnen jene die ohne Exkremente sind. Andere Arbeiterinnen bewachen das Geschehen. Eine geht vom Ende der Reihe an den Anfang und sammelt die Fetzen ein. Die Türen öffnen sich, die Körper hieven sich ins Innere. Zum Schluss heben zwei Arbeiterinnen die Fußlosen auf und schmeißen sie auf den Körperhaufen. Zum Aufgang der Sonne purzeln die ersten heraus. Jene die noch atmen werden mit einem Transporter in die Halle gebracht, während dahinter das Feuer schon brennt. Jede Nacht sterben welche.", "„Du weißt es.“", "Die Rauchschwaden tragen die Leichen in den Himmel.", "„Jetzt bist du da. Das ist alles was zählt.“", "Ein paar Tage darauf steige ich in den Bus um meinen ersten Dienst anzutreten. Vor mir strickt eine Frau, andere Arbeiterinnen packen ihre Brote aus, das Knistern der Stricknadeln, das Knistern der Alufolien juckt mir in den Ohren. Im Busfensterglas, das niemand öffnen kann, sehe ich mein Gesicht von den Knochen fließen, hinter dem Fensterglas schimmern die Planen der Zelte silbern. Unter der Brücke breitet sich die Zwischenstadt bis zu den Anlagen hinaus aus. Die Arbeiterinnen essen ihre Jause. Ich denke an die Busfahren früher vom Dorf in die Schule. Mein Rücken tut weh.", "Meine Stiefmutter war Leichenschminkerin, sie ist schon lange tot. In den letzten Jahren bevor sie starb, hatte sie viel zu tun gehabt. Da ist sie noch einmal aufgeblüht. Als die Stiefmutter ins Haus kam, stickte sie meinen Namen auf Leinen. Ich stand in der Stube und schaute ihr zu. Das Metall der Nadel silberte mir in den Augen, dass ich blinzelte.", "„Deine Aussteuer.“", "Hinter dem Fenster schmolz die Kontur der Bergkette in den Abend.", "Ich dachte an die Hände meiner Mutter.", "„Ich hätte da noch eine zum Heiraten.“", "Keine Ahnung, ob mein Vater jemals verstanden hat, dass die Mutter tot war. Vielleicht rückte an das Wort „tot“ eine Stille, eine unbestimmte Sehnsucht, für die er keine Worte hatte und die ihn manchmal derart ausfüllte, dass er hinter ihr verschwand.", "Als ich in der Stube stand und die Stiefmutter beim Sticken beobachtete, sah ich gleichzeitig, wie die groben Hände der unbekannten Frau, den Körper meiner Mutter wuschen, einschmierten, schminkten. Jenen Körper, der mir einmal nah und am offenen Sarg so fremd geworden war. In der Stube legte ich die Hände übereinander, die Stiefmutter stierte. Meine Fingernägel schnitten dünne Halbmonde in meine Haut. In diesem Augenblick war die unbekannte Frau zu meiner Stiefmutter geworden. Blut tropfte auf das Leinen. Die Stiefmutter fluchte.", "„Auf meine Stümpfe passt kein Fingerhut.“", "An diesem Abend, als die Stiefmutter meinen Namen in das Leinen stickte, beschloss ich zu gehen. Ich schaue auf meine Hände und denke an die Hände meiner Mutter. In der Ferne sind die Anlagen schon zu sehen, am Rande der Felder ragen die Türme der Hallen auf. Die Felder im Dorf waren ewig, wenn der Mond orangerot über den Feldern hing, bearbeiteten wir sie bis spät in die Nacht. Früher einmal hockte ich mit der Mutter am Feld, zum Erntemond und zog mit ihr das Gemüse aus der Erde. Ich hatte noch nicht bemerkt, wie schwach sie schon geworden war. Als sie am Feld zusammenbrach, drückte sie meine Hand. Es war ihr letzter Erntemond. Sie schaute den Mond an, dann zog mich zu sich.", "Zumindest wünschst du dir diesen Augenblick einer Nähe.", "“In der Erinnerung liegt die Gegenwart.“", "„Ich hätte da noch einen zum Heiraten“", "Die Stiefmutter hatte mich „mein Bub“ genannt.", "Vor deinen Augen siehst du die Stiefmutter den Schenkelstipfel deines Vaters bearbeiten, auf dieselbe Weise, wie sie das Gemüse aus der Erde zog.", "Der Bus wird langsamer, ich muss unbedingt an die frische Luft. Von den Erinnerungen wird mir übel. Meine Fingerkuppen brennen. Ich lehne mich mit dem Oberkörper nach vorne und schütze mit den Händen meine Ohren. Die Frau strickt immer noch. Das Knistern ist endlos. Der Bus hält.", "Der Mutter habe ich noch einmal meine Lippen an die blutleeren Wangen gelegt, bevor sie starb. Zumindest wünschst du dir diesen Augenblick einer Nähe.", "Die Stiefmutter küsse ich lieber tot als lebendig. Die Kinder spielten unter den Totenbetten mit den anderen Kindern im Dorf „Verstecken“, während aus dem Totenzimmer tagein, tagaus ein Teppich aus gesungenen Gebeten zu hören war.", "Sie fehlt dir, du hast noch nicht begriffen, dass die Toten tot sind und dich nicht mit ihrem Sterben anstecken.", "Wir steigen aus und steuern auf die Anlage zu. Ich weiß, dass es noch viel schlimmer hätte kommen können. Das Tor geht auf.", "Das Klappern, das Piepen, das Rascheln, das Röcheln, das Rasseln, das Saugen, das Seufzen, das Stöhnen, das Schluchzen, das Schniefen, das Wimmern, das Husten. Türen öffnen sich, mehr Kranke, noch Kränkere kommen, ein Körperhaufen aus wogenden Brustkörben. Jede Nacht werden jene, die schon lange da sind zum Flicken in den Keller geschoben. Die Kranken sitzen festgebunden und ohne Bewusstsein in Rollstühlen. Wir schieben sie in die riesige Halle, an die für sie vorgesehenen Stellplätze. Dann schließen wir sie an die Apparate an, die hinter ihren Rollstühlen in den Wandversenkungen angebracht wurden. Ich dimme das Licht. Die Apparate blinken, surren, sacht. Die Kranken wachen auf und lauschen. Eine Kollegin erklärt die Technik, wir teilen Nadeln und Fingerhüte aus. Zwischendurch dröhnt das Mikrophon unerträglich hoch und laut, die Kollegin flucht, wir verziehen die Gesichter. Das Stück Plane liegt über dem meterlangen Hallenboden ausgebreitet, grau glänzend, irgendwie erhaben und schön, denke ich fast jedes Mal. An ein paar Stellen hat sie sanfte Falten geschlagen. Wir warten. Die Kranken drohen schon wieder zu dämmern, ein paar lassen die Köpfe hängen, wir fahren die Energie der Apparate hoch. Dann kommen die Lungen. Sie schwimmen in Schüsseln. Schwer schwanken sie, in eine Flüssigkeit eingelegt, hin und her. Ich drehe das Bodenlicht auf, sodass die brüchigen Stellen der Plane von unten mit Licht angeflutet, besser erkennbar sind. Die Belegschaft verteilt die Schüsseln. Heute dauert es zum Glück nicht so lange. Die Kranken beginnen die Kapillaren aus den Lungenlappen zu lösen und in die Ösen der Nadeln zu fädeln. In den nächsten Stunden werden wir ihre Rollstühle an die verschiedenen Stellen der Plane schieben und sie werden flicken.", "Über dem Atlantik befanden sich mehrere Aurora Borealis, sie wanderten südwärts, färbten den über Europa lagernden Dunstteppich in grünviolette Farben und verrieten die Neigung der Sonne zu erhöhtem Materienejakulat. Die ausgestoßenen Teilchen taten ihre Schuldigkeit. Die Ionenkonzentration der Erde stand in einem außerordentlichen Verhältnis zu ihrem herkömmlichen Tages-, wie auch Jahresgang. Die Sonne trug angesichts des erst kürzlich angebrochenen, neuen Zyklus auffallend kräftige Zeichen. In die oberen Stockwerke der Magnetatmosphäre drang der erhöhte Teilchenstrom stetig ein, die Kompassnadeln schlugen aus, die Vögel flogen irritiert in alle Richtungen auseinander, die Messstationen in einer der wunchernden Wüsten zeichnete dieses sanfte, aber höchst alarmierende Klicken auf, und die Welt erschauderte. Mit einem Wort, das das Tatsächliche recht gut bezeichnet, auch wenn es etwas altmodisch ist: Ein heftiger Sonnensturm erreichte die Erde.", "Es war 2025 und es war in Wien. Ich radelte gerade den Gürtel entlang, bremste an einer roten Ampel ausnahmsweise ab, um dem Knopf im Ohr, der mir gerade die literarisierte Version eines Wetterberichts einflüsterte, aufmerksamer zu folgen. Vor mir flatterte ein gemusterter Damenrock an einer viel befahrenen Straße im Wind, der mir entgegenschlug, ich zog den Schal enger. Rechter Hand am Würstelstand neben dem Blumengeschäft schlossen sich Schellen um Kinderhände, die Polizei zerrte den kleinen Körper zum Wagen, er verschwand hinter den laut zufallenden Türen, als ich, plötzlich meinen Blick Richtung Himmel schwenken ließ und sah, dass da eine Plane war.", "Unter der Plane ist alles."];
const MIXED = Object.freeze({
  threeWordChance: 0.43,
  twoWordChance: 0.72,
  maxSourceRun: 8,
  candidatesPerSentence: 4
});
const wordPattern = /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:[’'*‑-][\p{L}\p{M}\p{N}]+)*/gu;
const keyOf = word => word.toLocaleLowerCase('de');
const joinKey = words => words.join(' ');
const add = (map, key, item) => {
  const values = map.get(key);
  if (values) values.push(item);
  else map.set(key, [item]);
};

// Finite verb forms occurring in the corpus. The clause-state check prevents
// cuts such as splicing a post-verbal object directly onto a subject.
const finiteForms = new Set((
  'bin ist sind war waren wäre wird werden wurde wurden haben hat hätte hebt senkt schiebt bohren fallen öffnet ' +
  'brennt krümmen öffnen hieven bleiben stellen atmen liegen zeigen ruhen brummen beißen knüllt raschelt fahren ' +
  'lagen glucksen schlägt zittern vibrieren wölbt enthüllt verdichten aneinanderrücken setzen schälen kitzelt ' +
  'flattern zieht schauen zucken schultern knicken singen steigen reiten würde erhöht setzt streichelt pulsieren ' +
  'verwandeln schöpft gießt tropfen greift trägt kann darf verrotten ruft keucht stöhnt heben beginnt blinzelt ' +
  'hört prasseln vermag behilft muss braucht legt lässt geht husten streunen schützen blitzt schaut bewegen ' +
  'betritt nimmt führt besteht haut zuckt drückt blickt deutet stößt macht kreischen springen schnauft spüren ' +
  'blicken gehen schweigen halten leuchten machen bündeln gibt zurückziehe verarbeite verschwindet stülpen ' +
  'stecken tuscheln wenden fesseln legen vergessen beobachtet erheben entrollen ploppt strecken dehnen räkeln ' +
  'berühren zwicken ziehen schwitzen stöhnen flattert landet sinkt blättert rascheln genießen perlt nähert ' +
  'scheint dringt übertritt entfaltet pudert treten schwellen sitzt schreit klammert schlackern kullert löst ' +
  'tritt beugt legten formierten verließen konnte hätten wagten wölbten längten reckten brach stellte knickten ' +
  'verminderten breiteten warf kitzelte sah schlummernden anschwollen rieben begann zitterten erinnerten ' +
  'umfielen weiterzitterten standen kehrten schaute tauchten kamen fixierten nahmen begannen nicken sterben ' +
  'tragen hängen hocken fließt tätscheln quillt kommen schwimmen schwanken flicken müssen schillern gräbt wühlt ' +
  'steckt lugen spürt krümmt abfallen ankommen anstecken atme aufgeblüht aufhört aufklappen aufpassen aufsaugen ' +
  'aufwache aufweist ausfüllt ausschmücken ausstoßen auszuscheißen bade bearbeitet befinden beginne beginnen ' +
  'beherrschen bekomme bekommt bellt beobachtete beschließe besitzen bestehe betrat betrete biege bist bleibe ' +
  'blinzelte blinzle blitzen brechen dachte dauert denke dimme drehe dreht drohe drängen dröhnt einspritzt ' +
  'entschuldige entziffern erfassen erinnern erschrecke ertrinken erwacht erwartet erwischt existiert explodiert ' +
  'fahre fanden fehlt fliege fließen fressen funktioniert fällt fühlt galten gebe gehe gehst gehört gelingt ' +
  'geschieht gingen glaube glauben gleiten glimmt grabe habe halte hast hatte hebe heißt hereinbricht hielt ' +
  'hielte hievt hinauszögern hockte höre kannte keift kenne kennen klappe klatschen kleben klopft knartscht ' +
  'kommst konnten kontrollieren können könnte kürzen langziehen lasse laufe laufen leckt lege legte lehne lehnte ' +
  'lernte liebe liege liegt lobst lächeln mache musst möchte nachschenkt nannte nähst perlen perlten pisst ' +
  'platzen presse radelte rasen recken redest reiben reiße richteten riechen rinnen rollt rutschen rückte sage ' +
  'sagen sagst sagte schaue schauten schiebe schieben schießen schießt schlafe schlagen schließen schlürfen ' +
  'schäme sehe sehen setze singt sitze sitzen sparen spechtle spendete spreche sprechen springt spuren spüre ' +
  'starre starren stehe steht steige steigt stelle stemmen stickte strampeln streiche stürzen suche suchen ' +
  'tauchen taucht teilen tippe trage traust trennt trete trifft trinken tropft tropfte tränt tummeln tunken töte ' +
  'töten umdrehen unterbricht verachte verblassen verbringe verfällt verheddere verlassen vermehren verschlucken ' +
  'verschwinde verstehen verstummt versuche versuchen vervielfachen verziehen wanderten warten wartet warteten ' +
  'weichte weine weinte weißt wende werde werfe wissen wohnst wollen wollte wundere wusste wären wünsche ' +
  'wünschst wünscht wünschte würden zerknüllte zerrte zischt zucke zurückkehren zurückweichen zusammensetzen ' +
  'zuwendet zwicke zwitschern zögere zünde öffne überlegt wirst hatten kannst musste dürfen soll sollen sollte ' +
  'will willst mag weiß gab ging kommt kam sieht stand lag sagt '
).split(/\s+/));
function hasFinite(word, first = false) {
  return (first || word[0] === word[0].toLocaleLowerCase('de')) && finiteForms.has(keyOf(word));
}
function prepareModel() {
  const starts = [], single = new Map(), pairs = new Map(), triples = new Map();
  const fragments = [], sourceWindows = new Set();
  const windowSize = MIXED.maxSourceRun + 1;

  for (const paragraph of CORPUS) {
    for (const match of paragraph.matchAll(/([^.!?…]+)([.!?…]+|$)/gu)) {
      const tokens = [...match[1].matchAll(wordPattern)];
      if (!tokens.length) continue;
      const words = tokens.map(t => t[0]), keys = words.map(keyOf);
      const stop = match[2].includes('?') ? '?' : match[2].includes('!') ? '!' : '.';
      fragments.push(' ' + joinKey(keys) + ' ');
      if (words.length >= 4) {
        const verbIndex = words.findIndex((word, i) => hasFinite(word, i === 0));
        const startSize = Math.min(words.length - 1, Math.max(3, verbIndex < 0 ? 3 : Math.min(5, verbIndex + 1)));
        const opening = match[1].slice(tokens[0].index, tokens[startSize - 1].index + words[startSize - 1].length)
          .replace(/[„“”«»"–]/gu, '').replace(/\s+/gu, ' ').trim();
        starts.push({ text: opening, words: words.slice(0, startSize), keys: keys.slice(0, startSize) });
      }
      for (let i = windowSize; i <= keys.length; i++) {
        sourceWindows.add(joinKey(keys.slice(i - windowSize, i)));
      }
      let finiteInClause = false;
      for (let i = 0; i < words.length; i++) {
        if (hasFinite(words[i], i === 0)) finiteInClause = true;
        let edge = { stop };
        let comma = false;
        if (i + 1 < words.length) {
          const gap = match[1].slice(tokens[i].index + words[i].length, tokens[i + 1].index);
          comma = /[,;:–]/u.test(gap) || /\s-\s/u.test(gap);
          edge = { word: words[i + 1], key: keys[i + 1], sep: comma ? ', ' : ' ' };
        }
        edge.finiteInClause = finiteInClause;
        if (comma) finiteInClause = false;
        add(single, keys[i], edge);
        if (i) add(pairs, keys[i - 1] + ' ' + keys[i], edge);
        if (i > 1) add(triples, joinKey(keys.slice(i - 2, i + 1)), edge);
      }
    }
  }
  return { starts, single, pairs, triples, source: fragments.join('|'), sourceWindows };
}

let sharedModel;
function randomFrom(seed) {
  if (seed === undefined) return Math.random;
  let s = Number(seed) >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let n = Math.imul(s ^ (s >>> 15), s | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

// Earlier receivers can still call their selection setters. Both settings are fixed.
function ignoreLegacySelection() {}

function createGenerator({ seed } = {}) {
  const model = sharedModel || (sharedModel = prepareModel());
  const random = randomFrom(seed), recent = [], openings = [], passages = new Set();
  const pick = a => a[Math.floor(random() * a.length)];

  function candidate() {
    for (let attempt = 0; attempt < 650; attempt++) {
      const first = pick(model.starts);
      let printed = first.text.charAt(0).toLocaleUpperCase('de') + first.text.slice(1);
      const keys = first.keys.slice(), trigrams = new Set();
      for (let i = 3; i <= keys.length; i++) trigrams.add(joinKey(keys.slice(i - 3, i)));
      let spokenVerb = first.words.some((word, i) => hasFinite(word, i === 0));
      let finiteInClause = first.text.split(/[,;:]/u).pop().trim().split(/\s+/u).some(w => hasFinite(w));
      const max = 14 + Math.floor(random() * 11);
      while (keys.length <= max) {
        const n = keys.length, last = keys[n - 1];
        const pair = n > 1 ? keys[n - 2] + ' ' + last : null;
        const suffix = n >= MIXED.maxSourceRun ? joinKey(keys.slice(-MIXED.maxSourceRun)) + ' ' : null;
        const observedPair = model.pairs.get(pair) || [];
        const endingsAllowed = n >= 6 && spokenVerb && observedPair.some(e => e.stop) &&
          !model.source.includes(' ' + joinKey(keys) + ' ');
        const allowed = edge => {
          if (edge.finiteInClause !== finiteInClause) return false;
          if (edge.stop) return endingsAllowed;
          if (n === max || last === edge.key) return false;
          if (suffix && model.sourceWindows.has(suffix + edge.key)) return false;
          return !pair || !trigrams.has(pair + ' ' + edge.key);
        };
        let choices;
        // Articles and common connecting words need at least the two-word context.
        const requirePair = /^(der|die|das|den|dem|des|ein|eine|einer|einem|einen|eines|im|am|zum|zur|vom|ins|ans|aufs|aus|zu|mit|von|für|in|an|auf|und|oder|weil|als|wie|wenn|ob|ihre|ihren|ihrem|ihrer|seine|seinen|diesem)$/u.test(last);
        if (random() < MIXED.threeWordChance) {
          choices = model.triples.get(joinKey(keys.slice(-3)))?.filter(allowed);
        }
        if (!choices?.length && (requirePair || random() < MIXED.twoWordChance)) choices = observedPair.filter(allowed);
        if (!choices?.length && !requirePair) choices = model.single.get(last).filter(allowed);
        if (!choices?.length) break;
        const endings = n >= 13 ? choices.filter(e => e.stop) : [];
        const edge = endings.length && random() < 0.7 ? pick(endings) : pick(choices);
        if (edge.stop) {
          if (recent.includes(printed + edge.stop)) break;
          return { line: printed + edge.stop, keys };
        }
        if (pair) trigrams.add(pair + ' ' + edge.key);
        keys.push(edge.key);
        if (edge.sep === ', ') finiteInClause = false;
        if (hasFinite(edge.word)) { spokenVerb = true; finiteInClause = true; }
        printed += edge.sep + edge.word;
      }
    }
    throw new Error('Die Wortkette konnte keinen neuen Satz abschließen.');
  }

  function sentence() {
    // Prefer attested four-word sequences and varied openings across candidates.
    let best, opening, highest = -Infinity;
    for (let run = 0; run < MIXED.candidatesPerSentence; run++) {
      const { line, keys } = candidate();
      const start = joinKey(keys.slice(0, 3));
      let score = random() * 0.1 - openings.filter(old => old === start).length * 0.18;
      for (let i = 3; i < keys.length; i++) {
        const context = joinKey(keys.slice(i - 3, i));
        if (model.triples.get(context)?.some(edge => edge.key === keys[i])) score += 1 / (keys.length - 3);
      }
      if (score > highest) { highest = score; best = line; opening = start; }
    }
    recent.push(best); openings.push(opening);
    if (recent.length > 36) recent.shift();
    if (openings.length > 12) openings.shift();
    return best;
  }
  function next() {
    let passage;
    for (let i = 0; i < 10; i++) {
      passage = sentence() + ' ' + sentence();
      if (!passages.has(passage)) break;
    }
    passages.add(passage);
    if (passages.size > 256) passages.delete(passages.values().next().value);
    return passage;
  }
  return Object.freeze({ next, setMode: ignoreLegacySelection });
}

const KLATT_FEMALE = `language variant
name klatt-f
gender female
klatt 3
pitch 178 252
flutter 2
roughness 0
formant 0 105 100 150
formant 1 116 95 160
formant 2 114 85 150
formant 3 110 85 150
formant 4 115 80 150
formant 5 115 80 150
formant 6 110 70 150
formant 7 110 70 150
formant 8 110 70 150
intonation 2
`;

// v100: Ina. An older lady from eSpeak NG's Klatt synthesizer: a lower, narrower pitch range,
// a slightly longer vocal tract, a tremor (flutter), some roughness and breath, slow speech.
const KLATT_OLD_LADY = `language variant
name alte-dame
gender female 70
klatt 3
pitch 148 198
flutter 28
roughness 4
voicing 88
breath 9 9 7 5 3 1
breathw 150 150 200 200 400 400
formant 0 98 100 150
formant 1 106 92 165
formant 2 104 82 155
formant 3 101 82 150
formant 4 104 76 150
formant 5 104 76 150
formant 6 100 66 150
formant 7 100 66 150
formant 8 100 66 150
intonation 2
`;

const voice = (engine, id, label, description, extra = {}) => Object.freeze({
  id, engine, label, description, tempo: 1, pitch: 1, formant: 1, fx: null, ...extra,
  ...(extra.fx ? { fx: Object.freeze({ ...extra.fx }) } : {})
});
const VOICES = Object.freeze([
  voice('pico', 'original', 'Original', 'Die bisherige Sendestimme ohne Veränderung.'),
  voice('pico', 'pico-hell', 'Hell', 'Kürzerer Vokaltrakt und höhere Lage. Wirkt jünger und klarer.',
    { pitch: 1.12, formant: 1.09 }),
  voice('pico', 'pico-dunkel', 'Dunkel', 'Längerer Vokaltrakt, tiefere Lage und ruhigeres Tempo.',
    { tempo: 0.9, pitch: 0.86, formant: 0.93 }),
  voice('pico', 'pico-ansage', 'Ansage', 'Langsam gesprochen, mit dem Nachhall einer leeren Halle.',
    { tempo: 0.8, pitch: 0.95, fx: { type: 'room', amount: 0.45 } }),
  voice('pico', 'pico-maschine', 'Maschine', 'Ringmodulation bei 52 Hz legt einen metallischen Kern unter die Stimme.',
    { pitch: 0.97, fx: { type: 'ring', amount: 0.6 } }),
  voice('pico', 'pico-zwilling', 'Zwilling', 'Zwei leicht gegeneinander verschobene Stimmen sprechen gleichzeitig.',
    { formant: 1.03, fx: { type: 'chorus', amount: 0.7 } }),
  voice('pico', 'pico-digital', 'Digital', 'Grob abgetastet und auf wenige Bit reduziert.',
    { fx: { type: 'crush', amount: 0.65 } }),
  voice('espeak', 'espeak-anika', 'Anika', 'Die deutsche Frauenvariante von eSpeak. Deutlich synthetisch, gut verständlich.',
    { variant: 'anika', rate: 125 }),
  voice('espeak', 'espeak-f2', 'Formant F2', 'Hauchiger Formantklang mit kurzem Echo.',
    { variant: 'f2', rate: 142 }),
  voice('espeak', 'espeak-f4', 'Formant F4', 'Hellere Formantlage mit leichtem Raumanteil.',
    { variant: 'f4', rate: 140 }),
  voice('espeak', 'espeak-belinda', 'Belinda', 'Hohe, schmale Stimme mit wenig Vibrato.',
    { variant: 'belinda', rate: 138 }),
  voice('espeak', 'espeak-roboter', 'Anika Roboter', 'Anika ohne Vibrato und mit metallischem Kurzecho.',
    { variant: 'anikaRobot', rate: 125 }),
  voice('espeak', 'espeak-fluestern', 'Flüstern', 'Stimmlos geflüsterte Frauenvariante.',
    { variant: 'whisperf', rate: 140 }),
  voice('espeak', 'espeak-alte-dame', 'Ältere Dame', 'eSpeak NG Klatt: tiefere, zittrige, leicht hauchige Frauenstimme, langsam gesprochen.',
    { variantText: KLATT_OLD_LADY, rate: 122 }),
  voice('espeak', 'espeak-klatt', 'Klatt', 'Klatt Formantsynthese in weiblicher Lage, der Klang früher Sprachcomputer.',
    { variantText: KLATT_FEMALE, rate: 140 })
]);
const ORIGINAL_VOICE = VOICES[0];
const ENGINES = Object.freeze({
  pico: 'SVOX Pico',
  espeak: 'eSpeak NG',
  system: 'Systemstimme'
});

const STATION_ID = 'radio-plane';
const scriptURL = globalThis.document?.currentScript?.src;
const workerFiles = { pico: 'plane-voice.worker.mjs?v=5', espeak: 'plane-voice-espeak.worker.mjs?v=1' };
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const num = (n, fallback) => Number.isFinite(n) ? n : fallback;

function resolveVoice(choice) {
  if (!choice) return ORIGINAL_VOICE;
  const base = typeof choice === 'string' ? VOICES.find(v => v.id === choice)
    : VOICES.find(v => v.id === (choice.base || choice.id));
  if (typeof choice === 'string') {
    if (!base) throw new Error('Unbekannte Stimme: ' + choice);
    return base;
  }
  const v = { ...(base || {}), ...choice };
  if (!ENGINES[v.engine]) throw new Error('Unbekannte Sprachausgabe.');
  return Object.freeze({
    ...v,
    id: String(v.id || 'eigene'),
    tempo: clamp(num(v.tempo, 1), 0.5, 1.6),
    pitch: clamp(num(v.pitch, 1), 0.6, 1.6),
    formant: v.engine === 'system' ? 1 : clamp(num(v.formant, 1), 0.82, 1.22),
    fx: v.fx && v.fx.type && v.fx.type !== 'none'
      ? Object.freeze({ ...v.fx, type: v.fx.type, amount: clamp(num(v.fx.amount, 0.5), 0, 1) }) : null
  });
}

function systemVoices() {
  const synth = globalThis.speechSynthesis;
  if (!synth) return [];
  return synth.getVoices().filter(v => /^de(\b|[-_])/iu.test(v.lang)).map(v => Object.freeze({
    id: 'system:' + v.voiceURI, engine: 'system', voiceURI: v.voiceURI, label: v.name,
    description: (v.localService ? 'Auf diesem Gerät installiert' : 'Vom Browser über das Netz bereitgestellt') +
      ' (' + v.lang + '). Läuft ohne Funkfilter und ist nur hier im Studio verfügbar.',
    tempo: 1, pitch: 1, formant: 1, fx: null
  }));
}

function synthRequest(v, text) {
  if (v.engine === 'pico') {
    return { text, speed: Math.round(clamp(92 * v.tempo / v.formant, 20, 500)),
      pitch: Math.round(clamp(100 * v.pitch / v.formant, 50, 200)) };
  }
  return { text, variant: v.variant, variantText: v.variantText,
    rate: Math.round(clamp((v.rate || 160) * v.tempo / v.formant, 80, 450)), pitch: v.pitch / v.formant };
}

function applyFx(x, rate, fx) {
  if (!fx || !fx.amount) return x;
  const a = fx.amount, n = x.length;
  if (fx.type === 'ring') {
    const w = 2 * Math.PI * 52 / rate, y = new Float32Array(n);
    for (let i = 0; i < n; i++) y[i] = x[i] * (1 - a + a * 1.6 * Math.sin(w * i));
    return y;
  }
  if (fx.type === 'crush') {
    const hold = Math.max(1, Math.round(rate / (9000 - 6000 * a))), steps = 2 ** Math.round(9 - 5 * a);
    const y = new Float32Array(n);
    let held = 0;
    for (let i = 0; i < n; i++) {
      if (i % hold === 0) held = Math.round(x[i] * steps) / steps;
      y[i] = x[i] * (1 - a) + held * a;
    }
    return y;
  }
  if (fx.type === 'aged') {
    // Old voice: unsteady pitch (smoothed random jitter + irregular tremor), shimmer,
    // breath noise following the speech envelope, roughness and a duller top end.
    const g = k => clamp(num(fx[k], 0), 0, 1), jit = g('jitter'), shim = g('shimmer'), breath = g('breath'),
      trem = g('tremor'), rough = g('rough'), dark = g('dark'), rateT = num(fx.tremorRate, 5.5);
    let seed = 12345;const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
    const lp = f => 1 - Math.exp(-2 * Math.PI * f / rate);
    const kJ = lp(14), kS = lp(28), kR = lp(90), kE = lp(25), kD = lp(2200);
    let nJ = 0, nS = 0, nR = 0, env = 0, lo = 0, prevN = 0, phase = 0;
    const y = new Float32Array(n), read = t => { const i = Math.floor(t), f = t - i; return i < 0 || i + 1 >= n ? 0 : x[i] * (1 - f) + x[i + 1] * f; };
    for (let i = 0; i < n; i++) {
      nJ += (rnd() - nJ) * kJ; nS += (rnd() - nS) * kS; nR += (rnd() - nR) * kR;
      phase += 2 * Math.PI * rateT * (1 + 0.25 * nJ) / rate;
      const delay = (0.004 + jit * 0.0016 * nJ * 6 + trem * 0.0011 * Math.sin(phase)) * rate;
      let v = read(i - delay);
      v *= 1 + shim * 0.9 * nS * 3 - rough * 0.55 * Math.abs(nR) * 3;
      env += (Math.abs(v) - env) * kE;
      const w = rnd(), hiss = w - prevN; prevN = w;
      v += breath * 0.9 * env * hiss;
      lo += (v - lo) * kD; v = v * (1 - dark) + lo * dark;
      y[i] = v;
    }
    return y;
  }
  if (fx.type === 'chorus') {
    const y = new Float32Array(n), read = (t) => {
      const i = Math.floor(t), f = t - i;
      return i < 0 || i + 1 >= n ? 0 : x[i] * (1 - f) + x[i + 1] * f;
    };
    for (let i = 0; i < n; i++) {
      const t = i / rate;
      const d1 = (0.011 + 0.004 * Math.sin(2 * Math.PI * 0.33 * t)) * rate;
      const d2 = (0.019 + 0.005 * Math.sin(2 * Math.PI * 0.21 * t + 1.7)) * rate;
      y[i] = (x[i] + a * 0.8 * read(i - d1 * 1.004) + a * 0.6 * read(i - d2)) / (1 + a * 0.7);
    }
    return y;
  }
  if (fx.type === 'room') {
    const tail = Math.round(rate * (0.6 + 1.2 * a)), y = new Float32Array(n + tail);
    const combs = [0.0297, 0.0371, 0.0411, 0.0437].map(s => ({ buf: new Float32Array(Math.round(s * rate)), at: 0 }));
    const passes = [0.005, 0.0017].map(s => ({ buf: new Float32Array(Math.round(s * rate)), at: 0 }));
    const fb = 0.72 + 0.12 * a;
    for (let i = 0; i < y.length; i++) {
      const dry = i < n ? x[i] : 0;
      let sum = 0;
      for (const c of combs) {
        const out = c.buf[c.at];
        c.buf[c.at] = dry + out * fb;
        c.at = (c.at + 1) % c.buf.length;
        sum += out;
      }
      let s = sum / 4;
      for (const p of passes) {
        const out = p.buf[p.at], v = s + out * 0.7;
        p.buf[p.at] = v;
        p.at = (p.at + 1) % p.buf.length;
        s = out - v * 0.7;
      }
      y[i] = dry * (1 - a * 0.35) + s * a * 0.9;
    }
    return y;
  }
  return x;
}

function finishSignal(pcm, rate, fx) {
  let x = new Float32Array(pcm.length);
  for (let i = 0; i < x.length; i++) x[i] = pcm[i] / 32768;
  x = applyFx(x, rate, fx);
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += x[i] * x[i];
  const gain = Math.min(8, 0.16 / Math.max(1e-4, Math.sqrt(sum / x.length)));
  for (let i = 0; i < x.length; i++) {
    const v = x[i] * gain, m = Math.abs(v);
    x[i] = m <= 0.8 ? v : Math.sign(v) * (0.8 + 0.18 * Math.tanh((m - 0.8) / 0.18));
  }
  return x;
}

function createStation(options = {}) {
  const generator = createGenerator({ seed: options.seed });
  const ownsContext = !options.context && !options.destination;
  let context = options.context || options.destination?.context;
  if (context && options.destination && context !== options.destination.context) {
    throw new TypeError('AudioContext und Ziel müssen zusammengehören.');
  }
  const listeners = new Set(), workers = {}, cache = new Map();
  let text = generator.next(), number = 1, current = resolveVoice(options.voice);
  let route = options.route === 'direkt' ? 'direkt' : 'funk', repeat = !!options.repeat;
  let state = 'idle', running = false, error = '', revision = 0, disposed = false;
  let volume = 1, pan = 0, graph, pending, source, noise, gapTimer, utterance;
  let playback, startedAt = 0, length = 0, sampleRate = 16000;

  function getState() {
    return { id: STATION_ID, state, running, text, number, mode: 'mittel', voice: current.id, voiceSettings: current,
      engine: current.engine, route, repeat, sampleRate, error, volume, pan,
      elapsed: source ? clamp(context.currentTime - startedAt, 0, length) : 0, duration: length };
  }
  function publish() {
    const snapshot = getState();
    for (const fn of listeners) {
      try { fn(snapshot); } catch (e) { console.error('PLANE listener', e); }
    }
  }
  function subscribe(fn) {
    if (disposed) throw new Error('Der Sender wurde freigegeben.');
    listeners.add(fn);
    fn(getState());
    return () => listeners.delete(fn);
  }

  function makeAudio() {
    if (graph) return;
    if (!context) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) throw new Error('Dieser Browser unterstützt Web Audio nicht.');
      context = new AC();
    }
    const high = context.createBiquadFilter(), low = context.createBiquadFilter();
    high.type = 'highpass'; high.Q.value = 0.68;
    low.type = 'lowpass'; low.Q.value = 0.68;
    const level = context.createGain(), panner = context.createStereoPanner?.(), meter = context.createAnalyser();
    const hiss = context.createGain();
    level.gain.value = volume;
    hiss.connect(high); high.connect(low); low.connect(level); level.connect(meter);
    // v95: an optional tap after the radio band and before the local level (the tower megaphone).
    if (options.tap) low.connect(options.tap);
    meter.fftSize = 512; meter.smoothingTimeConstant = 0.55;
    if (panner) {
      panner.pan.value = pan;
      meter.connect(panner); panner.connect(options.destination || context.destination);
    } else {
      meter.connect(options.destination || context.destination);
    }
    const radioNoise = context.createBuffer(1, Math.ceil(context.sampleRate * 1.1), context.sampleRate);
    const data = radioNoise.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < data.length; i++) {
      prev = 0.62 * prev + 0.38 * (Math.random() * 2 - 1);
      data[i] = prev * 0.010;
    }
    graph = { high, low, level, panner, meter, hiss, radioNoise };
    applyRoute(true);
  }
  function applyRoute(instant) {
    if (!graph) return;
    const funk = route === 'funk', t = context.currentTime;
    const set = (param, value) => instant ? (param.value = value) : param.setTargetAtTime(value, t, 0.03);
    set(graph.high.frequency, funk ? 210 : 30);
    set(graph.low.frequency, funk ? 3450 : Math.min(18000, context.sampleRate / 2 - 100));
    set(graph.hiss.gain, funk ? 1 : 0);
  }
  function setMix({ gain = volume, pan: position = pan } = {}) {
    if (disposed) return;
    const g = clamp(Number.isFinite(gain) ? gain : 0, 0, 1);
    const p = clamp(Number.isFinite(position) ? position : 0, -1, 1);
    if (graph && g !== volume) graph.level.gain.setTargetAtTime(g, context.currentTime, 0.027);
    if (graph?.panner && p !== pan) graph.panner.pan.setTargetAtTime(p, context.currentTime, 0.045);
    volume = g; pan = p;
  }
  function readWaveform(target) {
    if (graph && running && source) graph.meter.getFloatTimeDomainData(target);
    else target.fill(0);
  }
  function ensureNoise() {
    if (noise) return;
    noise = context.createBufferSource();
    noise.buffer = graph.radioNoise; noise.loop = true; noise.connect(graph.hiss); noise.start();
  }
  function stopNode(node) {
    if (!node) return;
    node.onended = null;
    try { node.stop(); } catch {}
    node.disconnect();
  }
  function stopSystem() {
    if (!utterance) return;
    utterance.onend = utterance.onerror = null;
    utterance = null;
    globalThis.speechSynthesis?.cancel();
  }
  function cancelRender() {
    if (!pending) return;
    const job = pending;
    pending = null;
    clearTimeout(job.watchdog);
    job.resolve(null);
  }
  function interrupt() {
    revision++;
    clearTimeout(gapTimer);
    cancelRender();
    stopNode(source); source = null;
    stopSystem();
    length = 0;
  }
  function failedWorker(engine, message) {
    workers[engine]?.terminate(); delete workers[engine];
    const job = pending;
    if (!job || job.engine !== engine) return;
    clearTimeout(job.watchdog);
    pending = null;
    job.reject(new Error(message));
  }
  function workerFor(engine) {
    if (workers[engine]) return workers[engine];
    let w;
    const factory = options.workerFactories?.[engine] || (engine === 'pico' && options.workerFactory);
    if (factory) w = factory();
    else {
      const url = options.workerURLs?.[engine] || (engine === 'pico' && options.workerURL) ||
        (scriptURL ? new URL(workerFiles[engine], scriptURL).href : null);
      if (!url) throw new Error('Der Pfad zur Senderstimme fehlt.');
      w = new Worker(url, { type: 'module', name: 'Radiostudio · ' + ENGINES[engine] });
    }
    w.onerror = event => {
      if (workers[engine] !== w) return;
      event.preventDefault?.();
      failedWorker(engine, 'Die Stimme ' + ENGINES[engine] + ' konnte nicht geladen werden.');
    };
    w.onmessageerror = () => {
      if (workers[engine] === w) failedWorker(engine, 'Fehler beim Übertragen der Stimme.');
    };
    w.onmessage = ({ data }) => {
      if (workers[engine] !== w || !pending || data.id !== pending.id) return;
      if (data.error) {
        const job = pending;
        pending = null; clearTimeout(job.watchdog);
        job.reject(new Error(data.error));
        return;
      }
      const job = pending;
      pending = null; clearTimeout(job.watchdog);
      job.resolve(data);
    };
    return workers[engine] = w;
  }
  function renderVoice(id, v, line) {
    const w = workerFor(v.engine);
    return new Promise((resolve, reject) => {
      const watchdog = setTimeout(() => failedWorker(v.engine, 'Zeitüberschreitung beim Laden der Stimme.'), 30000);
      pending = { id, engine: v.engine, resolve, reject, watchdog };
      try { w.postMessage({ id, ...synthRequest(v, line) }); }
      catch { failedWorker(v.engine, 'Die Sprachausgabe konnte nicht gestartet werden.'); }
    });
  }
  function reportError(cause, id) {
    if (disposed || id !== revision) return;
    interrupt(); stopNode(noise); noise = null;
    running = false; state = 'error';
    error = cause?.message || 'Der Sender konnte nicht starten.';
    publish();
  }
  function afterPassage(id) {
    if (id !== revision || !running) return;
    state = 'gap'; publish();
    gapTimer = setTimeout(() => {
      if (!running || id !== revision) return;
      if (repeat) { interrupt(); broadcast(); }
      else next();
    }, 760);
  }
  async function bufferFor(id, v) {
    const key = JSON.stringify([synthRequest(v, text), v.engine, v.formant, v.fx]);
    if (cache.has(key)) {
      const hit = cache.get(key);
      cache.delete(key); cache.set(key, hit);
      return hit;
    }
    const message = await renderVoice(id, v, text);
    if (!message) return null;
    const { pcm, sampleRate: rate } = message;
    if (!(pcm instanceof Int16Array) || !pcm.length) throw new Error('Leeres Sprachsignal.');
    const playRate = clamp(Math.round(rate * v.formant), 8000, 96000);
    const signal = finishSignal(pcm, playRate, v.fx);
    const buffer = context.createBuffer(1, signal.length, playRate);
    buffer.copyToChannel ? buffer.copyToChannel(signal, 0) : buffer.getChannelData(0).set(signal);
    const entry = { buffer, rate };
    cache.set(key, entry);
    if (cache.size > 24) cache.delete(cache.keys().next().value);
    return entry;
  }
  function speakSystem(id, v) {
    const synth = globalThis.speechSynthesis;
    if (!synth || !globalThis.SpeechSynthesisUtterance) throw new Error('Dieser Browser bietet keine Systemstimmen an.');
    const choice = synth.getVoices().find(s => s.voiceURI === v.voiceURI);
    if (!choice) throw new Error('Die Systemstimme ist auf diesem Gerät nicht mehr verfügbar.');
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\*innen\b/giu, 'innen'));
    u.voice = choice; u.lang = choice.lang;
    u.rate = clamp(v.tempo, 0.5, 2); u.pitch = clamp(v.pitch, 0, 2); u.volume = volume;
    u.onend = () => { if (utterance === u) { utterance = null; afterPassage(id); } };
    u.onerror = event => {
      if (utterance !== u || event.error === 'interrupted' || event.error === 'canceled') return;
      utterance = null;
      reportError(new Error('Die Systemstimme hat abgebrochen (' + event.error + ').'), id);
    };
    utterance = u; sampleRate = 0;
    synth.speak(u);
    state = 'playing'; publish();
    return true;
  }
  async function playCurrent(id) {
    try {
      makeAudio();
      if (ownsContext && context.state !== 'running') await context.resume();
      if (!running || revision !== id) return false;
      const v = current;
      if (v.engine === 'system') return speakSystem(id, v);
      const entry = await bufferFor(id, v);
      if (!entry || !running || revision !== id) return false;
      sampleRate = entry.rate;
      source = context.createBufferSource(); source.buffer = entry.buffer; source.connect(graph.high);
      source.onended = () => {
        if (id !== revision || !running) return;
        source.disconnect(); source = null;
        afterPassage(id);
      };
      ensureNoise(); startedAt = context.currentTime; length = entry.buffer.duration;
      source.start(); state = 'playing'; publish();
      return true;
    } catch (e) { reportError(e, id); return false; }
  }
  function broadcast() {
    const id = revision;
    state = 'loading'; error = ''; publish();
    if (!running || id !== revision) return Promise.resolve(false);
    playback = playCurrent(id);
    return playback;
  }
  function start() {
    if (disposed) return Promise.resolve(false);
    if (running) return playback || Promise.resolve(true);
    running = true; revision++;
    return broadcast();
  }
  function stop() {
    if (disposed) return;
    running = false; interrupt(); stopNode(noise); noise = null;
    state = 'idle'; error = ''; publish();
  }
  function next() {
    if (disposed) return text;
    interrupt();
    try { text = generator.next(); }
    catch (e) { reportError(e, revision); return text; }
    number++;
    if (running) broadcast();
    else { state = 'idle'; error = ''; publish(); }
    return text;
  }
  function setVoice(choice) {
    if (disposed) return current;
    const resolved = resolveVoice(choice);
    const same = JSON.stringify(resolved) === JSON.stringify(current);
    current = resolved;
    if (same) return current;
    if (running) { interrupt(); broadcast(); }
    else publish();
    return current;
  }
  function setRoute(value) {
    if (disposed) return;
    route = value === 'direkt' ? 'direkt' : 'funk';
    applyRoute(false); publish();
  }
  function setRepeat(value) {
    if (disposed) return;
    repeat = !!value; publish();
  }
  function replay() {
    if (disposed) return Promise.resolve(false);
    if (!running) return start();
    interrupt();
    return broadcast();
  }
  function dispose() {
    if (disposed) return;
    stop(); disposed = true;
    for (const w of Object.values(workers)) w.terminate();
    cache.clear();
    if (graph) {
      for (const node of [graph.hiss, graph.high, graph.low, graph.level, graph.meter, graph.panner]) node?.disconnect();
      graph = null;
    }
    if (ownsContext && context && context.state !== 'closed') context.close().catch(() => {});
    state = 'disposed'; publish(); listeners.clear();
  }
  return Object.freeze({ start, stop, next, replay, setMix, setVoice, setRoute, setRepeat, readWaveform,
    getState, subscribe, dispose, setMode: ignoreLegacySelection });
}

// v99: characters speak their dialogue lines with the same engines, without the radio band.
// One line at a time; a new line or stop() cuts the previous one. reverse plays it backwards.
function createSpeaker(options = {}) {
  const context = options.context, workers = {};
  let revision = 0, pending = null, source = null, disposed = false;
  function workerFor(engine) {
    if (workers[engine]) return workers[engine];
    const factory = options.workerFactories?.[engine] || (engine === 'pico' && options.workerFactory);
    let w;
    if (factory) w = factory();
    else {
      const url = scriptURL ? new URL(workerFiles[engine], scriptURL).href : null;
      if (!url) throw new Error('Der Pfad zur Stimme fehlt.');
      w = new Worker(url, { type: 'module', name: 'Stimmen · ' + ENGINES[engine] });
    }
    w.onmessage = ({ data }) => {
      if (!pending || data.id !== pending.id) return;
      const job = pending; pending = null; clearTimeout(job.watchdog);
      if (data.error) job.reject(new Error(data.error)); else job.resolve(data);
    };
    w.onerror = event => {
      event.preventDefault?.(); workers[engine]?.terminate(); delete workers[engine];
      if (pending) { const job = pending; pending = null; clearTimeout(job.watchdog); job.reject(new Error('Stimme nicht geladen.')); }
    };
    return workers[engine] = w;
  }
  function stop() {
    revision++;
    if (pending) { const job = pending; pending = null; clearTimeout(job.watchdog); job.resolve(null); }
    if (source) { source.onended = null; try { source.stop(); } catch {} source.disconnect(); source = null; }
  }
  async function say(text, { voice: choice, reverse = false } = {}) {
    if (disposed || !context) return false;
    stop();
    const id = revision, v = resolveVoice(choice);
    if (v.engine === 'system' || !String(text || '').trim()) return false;
    const w = workerFor(v.engine);
    const message = await new Promise((resolve, reject) => {
      pending = { id, resolve, reject, watchdog: setTimeout(() => { if (pending?.id === id) { pending = null; reject(new Error('Zeitüberschreitung der Stimme.')); } }, 30000) };
      w.postMessage({ id, ...synthRequest(v, String(text).replace(/\*innen\b/giu, 'innen')) });
    });
    if (!message || id !== revision || disposed) return false;
    const { pcm, sampleRate: rate } = message;
    if (!(pcm instanceof Int16Array) || !pcm.length) return false;
    const playRate = clamp(Math.round(rate * v.formant), 8000, 96000);
    const signal = finishSignal(pcm, playRate, v.fx);
    if (reverse) signal.reverse();
    const buffer = context.createBuffer(1, signal.length, playRate);
    buffer.copyToChannel ? buffer.copyToChannel(signal, 0) : buffer.getChannelData(0).set(signal);
    source = context.createBufferSource(); source.buffer = buffer; source.connect(options.destination || context.destination);
    const own = source; source.onended = () => { if (source === own) { source.disconnect(); source = null; } };
    source.start();
    return true;
  }
  return Object.freeze({ say, stop, get speaking() { return !!source || !!pending; },
    dispose() { stop(); disposed = true; for (const w of Object.values(workers)) w.terminate(); } });
}

// v85 reports one { id, gain, pan } for each frequency even if several radios are on it.
function createReceiver(options = {}) {
  let station, active = false, disposed = false, chosen = options.voice, retryAt = 0, retries = 0;
  const now = () => options.context?.currentTime || 0;
  return Object.freeze({
    // keep: stay on air with the local speaker silent (v95: the tower megaphone is listening).
    update(channel, enabled = true, keep = false) {
      if (disposed) return;
      const heard = !!(enabled && channel?.id === STATION_ID && channel.gain > 0.0001);
      const audible = heard || !!(enabled && keep);
      if (audible && !station) {
        station = createStation({ ...options, voice: chosen });
        station.subscribe(s => {
          if (s.state === 'error') retryAt = now() + Math.min(30, 2 ** ++retries);
          else if (s.state === 'playing') { retryAt = 0; retries = 0; }
        });
      }
      if (audible) station.setMix(heard ? channel : { gain: 0, pan: 0 });
      if (active === audible) {
        if (audible && station.getState().state === 'error' && now() >= retryAt) return station.start();
        return;
      }
      active = audible;
      if (audible) return station.start();
      retryAt = 0; retries = 0;
      station?.stop();
    },
    setVoice(choice) {
      resolveVoice(choice);
      chosen = choice;
      station?.setVoice(choice);
    },
    getState() { return station?.getState() || { id: STATION_ID, state: 'idle', running: false, voice: chosen, initialized: false }; },
    dispose() { disposed = true; active = false; station?.dispose(); station = null; }
  });
}
globalThis.PlaneRadio = Object.freeze({
  id: STATION_ID, voices: VOICES, engines: ENGINES, resolveVoice, systemVoices,
  createGenerator, createStation, createReceiver, createSpeaker
});

})();
