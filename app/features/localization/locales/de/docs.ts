export default {
  title: "API-Dokumentation",
  description:
    "Vollständige Anleitung zur Verwendung unserer API für Template-Vorschau- und Export-Funktionen.",
  pageTitle: "API-Dokumentation",
  introduction: {
    title: "Einführung",
    overview:
      "Unsere API bietet programmatischen Zugriff auf Template-Vorschau- und Export-Funktionen. Sie können HTML-Vorschauen und PDF-Exporte Ihrer Templates mit einfachen HTTP-Anfragen generieren.",
    features:
      "Zu den Hauptfunktionen gehören: sichere API-Schlüssel-Authentifizierung, Unterstützung für benutzerdefinierte Template-Daten, mehrere Antwortformate (HTML/PDF oder JSON) und umfassende Fehlerbehandlung.",
  },
  gettingStarted: {
    title: "Erste Schritte",
    apiKey: {
      title: "API-Schlüssel erhalten",
      description:
        "Um die API zu verwenden, benötigen Sie einen API-Schlüssel. Navigieren Sie zu den Organisationseinstellungen und gehen Sie dann zum Abschnitt API-Schlüssel. Wenn Sie noch keinen Schlüssel haben, wird automatisch einer für Sie generiert. Kopieren Sie Ihren API-Schlüssel und bewahren Sie ihn sicher auf - Sie verwenden ihn zur Authentifizierung aller API-Anfragen.",
    },
    authentication: {
      title: "Authentifizierung",
      description:
        "Alle API-Anfragen müssen Ihren API-Schlüssel im Authorization-Header mit Bearer-Token-Authentifizierung enthalten:",
    },
    firstCall: {
      title: "Ihren ersten API-Aufruf tätigen",
      description:
        "Hier ist ein einfaches Beispiel, wie Sie eine Template-Vorschau mit cURL anzeigen:",
    },
  },
  apiDocumentation: {
    title: "API-Dokumentation",
    preview: {
      title: "Vorschau-API",
      description:
        "Generieren Sie eine HTML-Vorschau eines Templates. Gibt das gerenderte HTML zurück, das in einem Browser angezeigt oder in Ihre Anwendung eingebettet werden kann.",
      request: {
        title: "Anfragekörper",
      },
      response: {
        title: "Antwort",
        description:
          "Gibt standardmäßig HTML-Inhalt zurück. Fügen Sie ?format=json oder Accept: application/json Header hinzu, um eine JSON-Antwort zu erhalten:",
      },
      queryParams: {
        title: "Abfrageparameter",
      },
    },
    export: {
      title: "Export-API",
      description:
        "Generieren Sie einen PDF-Export eines Templates. Gibt eine PDF-Datei zurück, die heruntergeladen, gespeichert oder als E-Mail-Anhang gesendet werden kann.",
      request: {
        title: "Anfragekörper",
      },
      response: {
        title: "Antwort",
        description:
          "Gibt standardmäßig PDF-Binärinhalt zurück. Fügen Sie ?format=json oder Accept: application/json Header hinzu, um eine JSON-Antwort mit base64-kodiertem PDF zu erhalten:",
      },
      queryParams: {
        title: "Abfrageparameter",
      },
      useCases: {
        title: "Anwendungsfälle: PDFs per E-Mail senden",
        description:
          "Unten finden Sie Code-Beispiele zum Exportieren eines Templates als PDF und zum Senden als E-Mail-Anhang mit verschiedenen E-Mail-Anbietern. Wählen Sie Ihren bevorzugten E-Mail-Anbieter und Ihre Programmiersprache:",
        emailProvider: "E-Mail-Anbieter",
      },
    },
  },
  payloadSchema: {
    title: "Payload-Schema-Referenz",
    description:
      "Vollständige Referenz für alle Template-Typen, Abschnitte und Felder. Jeder Template-Typ hat spezifische Abschnitte mit definierten Feldern, Datentypen und Anforderungen.",
  },
};
