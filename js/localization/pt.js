// Brazilian Portuguese translations
const pt = {
    // Game title and instructions
    game: {
        title: "Manchetes",
        instructions: "Troque as letras para reconstruir a manchete da notícia!<br>Clique em duas letras para trocar suas posições.<br>A dica abaixo é um indício sobre o assunto do artigo."
    },
    
    // UI elements
    ui: {
        swaps: "Trocas",
        moves: {
            one: "jogada",
            other: "jogadas"
        },
        giveUp: "Desistir",
        nextHeadline: "Próxima",
        replay: "Jogar Novamente",
        readFullArticle: "Ler Artigo Completo",
        newHeadline: "Próxima Manchete",
        ok: "OK",
        cancel: "Cancelar"
    },
    
    // Color legend
    legend: {
        correct: "Posição correta",
        wrongPosition: "Posição errada",
        connectedWord: "Palavra cruzada", // "Cross word" context fits better than "intersecting"
        otherWord: "Outra palavra",
        // Shorter versions for when legend wraps to multiple lines
        correctShort: "Correto",
        wrongPositionShort: "Posição errada",
        connectedWordShort: "Conectada",
        otherWordShort: "Outra"
    },
    
    // Victory modal
    victory: {
        title: "Parabéns!",
        subtitle: "Você reconstruiu a manchete!",
        headlineLabel: "MANCHETE RECONSTRUÍDA",
        articlePrompt: "Leia o artigo completo para ver a manchete na íntegra",
        customPuzzlePrompt: "Você pode desafiar um amigo criando seu próprio quebra-cabeça",
        createOwnPuzzle: "Criar Meu Desafio",
        stats: {
            swaps: {
                one: "TROCA",
                other: "TROCAS"
            },
            rating: "CLASSIFICAÇÃO"
        },
        ratings: {
            perfect: "PERFEITO",
            excellent: "EXCELENTE",
            good: "BOM",
            fair: "RAZOÁVEL",
            complete: "CONCLUÍDO"
        },
        tooltips: {
            perfect: "🏆 Perfeito! Você atingiu a classificação máxima de 5 estrelas!",
            earned: {
                one: "🌟 Você ganhou 1 estrela completando em {swaps} {swapsWord}!<br>⭐ Ganhe {nextStars} estrelas completando em {threshold} {thresholdWord} ou menos",
                other: "🌟 Você ganhou {stars} estrelas completando em {swaps} {swapsWord}!<br>⭐ Ganhe {nextStars} estrelas completando em {threshold} {thresholdWord} ou menos"
            },
            getStars: {
                one: "⭐ Ganhe 1 estrela completando o desafio em {requiredSwaps} {requiredSwapsWord} ou menos",
                other: "⭐ Ganhe {starIndex} estrelas completando o desafio em {requiredSwaps} {requiredSwapsWord} ou menos"
            },
            getOneStar: "⭐ Ganhe {starIndex} estrela apenas completando o desafio"
        }
    },
    
    // Difficulty levels
    difficulty: {
        easy: {
            name: "Fácil",
            description: "Apenas palavras embaralhadas"
        },
        mediumEasy: {
            name: "Médio-Fácil",
            description: "Máx. 40% Verde"
        },
        medium: {
            name: "Médio",
            description: "Máx. 30% Verde"
        },
        mediumHard: {
            name: "Médio-Difícil",
            description: "Máx. 20% Verde"
        },
        hard: {
            name: "Difícil",
            description: "Máx. 15% Verde"
        }
    },
    
    // News categories
    category: {
        all: {
            name: "Tudo",
            description: "Todas as categorias"
        },
        general: {
            name: "Geral",
            description: "Notícias gerais"
        },
        economy: {
            name: "Economia",
            description: "Negócios e finanças"
        },
        technology: {
            name: "Tecnologia",
            description: "Tech e inovação"
        },
        sports: {
            name: "Esportes",
            description: "Notícias esportivas"
        }
    },
    
    // Debug panel
    debug: {
        toggleHint: "Pressione 'D' para alternar info de debug",
        title: "🔧 Informação de Depuração",
        close: "×",
        sections: {
            currentHeadline: "Manchete Atual",
            layoutGeneration: "Geração de Layout",
            shuffleDifficulty: "Embaralhamento e Dificuldade",
            headlineManagement: "Gerenciamento de Manchetes",
            alternativeHeadlines: "Manchetes Alternativas",
            compatibility: "Análise de Compatibilidade",
            testCaseHTML: "Código HTML do Caso de Teste",
            testCaseJS: "Código JS do Caso de Teste"
        },
        difficulty: "Dificuldade:",
        autoWin: "🏆 Vitória Automática (Debug)"
    },
    
    // Tooltips and hints
    hints: {
        tipPrefix: "💡 Dica:",
        hintTitle: "Dica"
    },
    
    // Toolbar tooltips
    toolbar: {
        menu: "Menu",
        howToPlay: "Como Jogar",
        nextPuzzle: "Próximo Desafio",
        createOwnPuzzle: "Criar Desafio"
    },
    
    // Menu items
    menu: {
        title: "Menu",
        language: "Idioma",
        difficulty: "Dificuldade",
        category: "Categoria",
        statistics: "Estatísticas",
        sound: "Som",
        help: "Ajuda",
        giveUp: "Desistir",
        giveUpDescription: "Revela a solução",
        nextPuzzle: "Próximo Desafio",
        nextPuzzleDescription: "Carregar nova manchete",
        createOwnPuzzle: "Crie Seu Desafio",
        createOwnPuzzleDescription: "Desafie um amigo"
    },
    
    // Loading messages
    loading: {
        fetchingHeadlines: "Buscando as últimas manchetes...",
        fetchingSubtext: "Isso pode levar alguns segundos"
    },
    
    // Tutorial
    tutorial: {
        welcome: {
            title: "Como Jogar?",
            content: "Sua missão é desembaralhar a **manchete** guiando-se pela **descrição abaixo do tabuleiro**. As letras ficam **verdes** quando colocadas **corretamente**.\n![Palavra reconstruída](imgs/ex_green_en.png)\n\n---\n\nLetras que pertencem à **palavra atual** mas estão na **posição errada** aparecem em **laranja**.\nPara **trocar duas letras**, basta **tocar** nelas uma por uma.\n![Toque em duas letras](imgs/ex_ornage_en.png)\n\n---\n\nLetras em uma **palavra cruzada** (que se conecta) aparecem em **roxo**. Letras de **outras palavras** permanecem **cinza**.\n![Outras cores](imgs/ex_misc_en.png)\n\n---\n\nUse a **lógica** e a **dica** para resolver a manchete com o menor número de movimentos possível.",
            buttonText: "Entendi"
        }
    },

    // Create Puzzle Page
    createPuzzle: {
        title: "Criar Desafio",
        subtitle: "Crie um quebra-cabeça personalizado para seus amigos.",
        headlineLabel: "Manchete Oculta (O Enigma)",
        headlineHint: "Mín. 5 palavras, 4+ letras cada. Pontuação e emojis serão ignorados.",
        headlinePlaceholder: "ex: Piratas do Caribe: A Maldição do Pérola Negra",
        wordAnalysisLabel: "ANÁLISE DAS PALAVRAS:",
        hintLabel: "Dica Contextual",
        hintHint: "A pista exibida para o jogador. <strong>Deve conter pelo menos 2x o número de palavras da manchete.</strong>",
        hintPlaceholder: "ex: Um filme de aventura sobre bucaneiros amaldiçoados que devem quebrar um antigo feitiço encontrando peças perdidas de ouro asteca antes da lua cheia",
        difficultyLabel: "Dificuldade",
        difficultyHint: "Escolha o quão desafiador o enigma será.",
        verifyButton: "Verificar e Gerar Prévia",
        backButton: "Voltar ao Jogo",
        previewTitle: "Grade e Link Gerados com Sucesso",
        statsWords: "Palavras:",
        statsLanguage: "Idioma:",
        statsDifficulty: "Dificuldade:",
        unsolvedGridTitle: "Enigma não resolvido (Dificuldade: {difficulty})",
        solvedGridTitle: "Enigma resolvido",
        createLinkButton: "Criar Link do Desafio",
        shareLabel: "Compartilhe este link:",
        copyButton: "Copiar Link",
        previewHeader: "Prévia",
        previewDisclaimer: "Este é um exemplo de layout gerado para o seu dispositivo. O layout real pode variar em outros dispositivos dependendo do tamanho da tela.",
        toastCopied: "Copiado para a Área de Transferência!",
        errors: {
            minWords: "Precisa de pelo menos {count} palavras (Atual: {current}). Continue digitando!",
            shortWords: "Encontrada(s) {count} palavra(s) muito curta(s) (marcada(s) em VERMELHO acima). Palavras devem ter 4+ letras.",
            mixedLanguages: "Não é possível misturar letras de idiomas diferentes.", // Cannot mix letters from different languages
            noHint: "Por favor, forneça uma dica.",
            hintTooShort: "Dica muito curta: {hintWords} palavras. Precisa de pelo menos {required} (2× a manchete).",
            layoutFailed: "Falha ao gerar o layout das palavras cruzadas. Tente palavras ou ordem diferentes."
        },
        language: {
            english: "INGLÊS",
            russian: "RUSSO",
            portuguese: "PORTUGUÊS",
            mixed: "MISTO/INVÁLIDO"
        }
    },

    // Puzzle Error (for custom puzzle loading failures)
    puzzleError: {
        title: "Erro no Quebra-cabeça",
        corruptedLink: "O link do desafio pode estar corrompido ou inválido.<br>Peça para a pessoa que te enviou mandar o link novamente.<br>Enquanto isso, você pode jogar o modo normal de Manchetes.",
        startRegularGame: "Iniciar Jogo Normal"
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.pt = pt;
}