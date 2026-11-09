/**
 * Main Application Controller for Percent Balloon
 * Supports Dual-Window Popup Controller (via BroadcastChannel & window.open),
 * CSV / Preset Question Set Auto-Loading, TV Telop Question Banner, Undo History, and Self-Tests.
 */
document.addEventListener('DOMContentLoaded', () => {
    const engine = new BalloonEngine('balloon-canvas');
    const sound = window.soundEngine;

    // Built-in Preset Question Sets (Difficulty-tiered Sign Language Sets + General Sets)
    const PRESET_SETS = {
        shuwa_easy: {
            name: '手話クイズ【易・初級】（全10問）',
            items: [
                {
                    question: '日本手話では、数字の「1」から「10」までを指の形で表します。この1〜10のうち、「片手だけ」で表すことができる数字は何％でしょうか？',
                    answer: 100,
                    source: '全日本ろうあ連盟「わたしたちの手話」数字表現',
                    explanation: '日本手話では1〜4は指の本数、5は親指、6〜9は親指＋他の指、10は人差し指を曲げて表すため、1〜10のすべて（100%）を片手だけで表現できます（実は9999まで片手で表せます）。'
                },
                {
                    question: 'ドラマ『silent』などの影響もあり手話への注目が高まっています。一般の成人男女を対象にした意識調査で、手話が全くできない人のうち「手話を覚えたい・学んでみたいと思ったことがある」と答えた人は約何％？',
                    answer: 54,
                    source: '株式会社ウェブギフト「手話に関する意識調査」（2025年8月発表）',
                    explanation: '手話が全くできない人のうち54.0%（半数以上）が「一度は手話を覚えてみたい」と回答しています。また調査全体の71%が手話に関心を持っています。'
                },
                {
                    question: '同じ一般向けの意識調査で、「ありがとう」などの簡単な挨拶程度も含めて「手話が少しはできる」と答えた人は全体の約何％？',
                    answer: 17,
                    source: '株式会社ウェブギフト「手話に関する意識調査」（2025年8月発表）',
                    explanation: '全体の約17%（約6人に1人）が挨拶などの簡単な手話を知っていると回答しました。なお、日常会話レベルまでできる人は全体の約1%にとどまります。'
                },
                {
                    question: '手話は世界共通のジェスチャーではなく、日本語とは異なる独自の文法を持つ「一つの言語」です。東京都の調査で、「手話が一つの言語であることを知っていた」と答えた人は約何％？',
                    answer: 64,
                    source: '東京都政策企画局「令和5年度 第5回インターネット都政モニターアンケート『障害者情報保障等について』」',
                    explanation: '正確には64.0%（回答者478人中）。手話が単なる身振りではなく、独立した一つの「言語」であるという認識は6割強まで広まっています。'
                },
                {
                    question: 'きこえない・きこえにくい人にとって大切なテレビの「字幕（クローズドキャプション）」。現在、NHK総合テレビの1日の総放送時間のうち、字幕が付いている番組は約何％？',
                    answer: 92,
                    source: '総務省「令和5年度 放送番組の字幕・解説・手話付与実績」（2024年10月公表）',
                    explanation: 'NHK総合の総放送時間の91.7%（普及目標の対象番組に限れば100.0%）に字幕が付与されています。'
                },
                {
                    question: 'NHK総合では総放送時間の92%に字幕が付いていますが、では民放キー局（日テレ・テレ朝・TBS・テレ東・フジテレビの5局平均）で、1日の総放送時間のうち字幕が付いている割合は約何％？',
                    answer: 70,
                    source: '総務省「令和5年度 放送番組の字幕・解説・手話付与実績」（2024年10月公表）',
                    explanation: '在京キー5局平均で総放送時間の70.4%（普及目標の対象番組では100.0%）に字幕が付いています。'
                },
                {
                    question: '内閣府の全国世論調査で、街中でよく見かける「障害者のための国際シンボルマーク（車いすマーク）」を知っていると答えた人は約何％？',
                    answer: 97,
                    source: '内閣府「障害者に関する世論調査（平成29年8月調査）」',
                    explanation: '正確には97.0%。ほぼ全員が知っている最も認知度の高いシンボルマークです。'
                },
                {
                    question: '外見からは分からなくても援助や配慮を必要としている人が身につける赤い十字とハートの「ヘルプマーク」。内閣府の全国世論調査（平成29年時点）で、このマークを知っていた人は約何％？',
                    answer: 37,
                    source: '内閣府「障害者に関する世論調査（平成29年8月調査）」',
                    explanation: '正確には36.8%。公共交通機関や自治体での配布が広がり、認知が進み始めた時期の統計です。'
                },
                {
                    question: '2025年11月に日本（東京）で初開催された、きこえない・きこえにくいアスリートの国際スポーツ大会「東京2025デフリンピック」。大会開催時の東京都の調査で、「デフリンピック」の名前を知っていた都民は約何％？',
                    answer: 73,
                    source: '東京都「令和7年度 都民のスポーツ活動に関する実態調査」',
                    explanation: '正確には73.1%。東京開催をきっかけに、都民の7割以上がデフリンピックを知るようになりました。'
                },
                {
                    question: '日本手話で「あ・い・う・え・お」の50音（清音46文字：あ〜ん＋「を」）を指の形で表す「指文字」。この46文字のうち、止まった形ではなく「手を動かして表現する文字（の・り・ん・を の4文字）」は約何％？',
                    answer: 9,
                    source: '全日本ろうあ連盟 標準指文字（50音・清音46文字）',
                    explanation: '清音46文字のうち、カタカナの形を空中に描く「の」「り」「ん」と、手前に引く「を」の4文字（4÷46＝8.7% ≒ 9%）だけが動きを伴います。'
                }
            ]
        },
        shuwa_normal: {
            name: '手話クイズ【普通・中級】（全10問）',
            items: [
                {
                    question: '役所や銀行・病院の窓口などにある、耳の形に矢印が入った緑色の「耳マーク（きこえにくい人への配慮を示すマーク）」。内閣府の全国世論調査で、このマークを知っていた人は約何％？',
                    answer: 12,
                    source: '内閣府「障害者に関する世論調査（平成29年8月調査）」',
                    explanation: '正確には12.0%。車いすマーク（97.0%）やヘルプマーク（36.8%）に比べると、耳マークはまだ1割強しか知られていないのが現状です。'
                },
                {
                    question: '手話が言語であるとの認識を広め、使いやすい環境を作る「手話言語条例」。現在、全国47都道府県のうち、この条例をすでに制定している都道府県は約何％？',
                    answer: 89,
                    source: '一般財団法人 全日本ろうあ連盟「手話言語条例マップ」（https://www.jfd.or.jp/s-jourei）',
                    explanation: '47都道府県中42都道府県（89.4%）が制定済みです。2013年の鳥取県を皮切りに全国約9割の都道府県へと広がりました。'
                },
                {
                    question: '2013年に全国で初めて「手話言語条例」を制定した鳥取県。その鳥取県が県民向けに実施したアンケートで、「鳥取県で手話言語条例が制定されたことを知っている」と答えた県民は約何％？',
                    answer: 78,
                    source: '鳥取県「県政参画電子アンケート（手話に関する意識調査）」',
                    explanation: '回答402名中78.4%が「知っている」と回答しました。全国初の制定自治体として、県民の間に高く浸透しています。'
                },
                {
                    question: '鳥取県では78%の県民が条例を知っていましたが、では2022年に「東京都手話言語条例」を制定した東京都のアンケートで、東京都に手話言語条例があることを知っていた都民は約何％？',
                    answer: 13,
                    source: '東京都政策企画局「令和5年度 第5回インターネット都政モニターアンケート『障害者情報保障等について』」',
                    explanation: '正確には12.7%。「手話が言語であること」は64.0%が知っていた一方、東京都手話言語条例自体の認知度は1割強にとどまっています。'
                },
                {
                    question: '東京2025デフリンピックの開催1年前（2024年11月）に東京都が実施した調査で、当時「デフリンピック」の名前を知っていた都民は約何％だったでしょうか？',
                    answer: 39,
                    source: '東京都「令和6年度 都民のスポーツ活動に関する実態調査」（2025年1月公表）',
                    explanation: '正確には39.0%。開催2年前の14.8%から大きく上昇し、さらに大会開催時には73.1%へと飛躍的に認知が広がりました。'
                },
                {
                    question: 'きこえない人と、きこえる人を、手話通訳オペレーターがビデオ通話と電話でつなぐ国の公共インフラ「電話リレーサービス」。全国調査で、このサービスを知っていた人は約何％？',
                    answer: 19,
                    source: '一般財団法人 日本財団電話リレーサービス「令和6年度 電話リレーサービス認知度調査」（2024年12月実施）',
                    explanation: '全国の認知率は19%（前年度は23%）。24時間365日、緊急通報にも対応する重要な公共インフラですが、一般への周知が課題となっています。'
                },
                {
                    question: '同じ「電話リレーサービス」の調査で、サービスの内容を説明されたあと「社会の公共インフラとして必要なサービスだと思う」と答えた人は全体の約何％？',
                    answer: 78,
                    source: '一般財団法人 日本財団電話リレーサービス「令和6年度 電話リレーサービス認知度調査」（2024年12月実施）',
                    explanation: '認知率は19%にとどまる一方、仕組みを知ると78%もの人が「公共インフラとして必要不可欠なサービスだ」と高く評価しています。'
                },
                {
                    question: '手話を言語として明確に位置づけた国連の条約「障害者権利条約」（日本は2014年に批准）。内閣府の全国世論調査で、この条約の名前や内容を知っていた人は約何％？',
                    answer: 25,
                    source: '内閣府「障害者に関する世論調査（令和4年11月調査）問10」（2023年3月公表）',
                    explanation: '「内容も含めて知っている（2.2%）」と「条約があることは知っている（22.5%）」を合わせて24.7%（約4人に1人）でした。'
                },
                {
                    question: '日本語の『広辞苑』には約25万語が載っていますが、2023年に改訂された全日本ろうあ連盟の標準辞書『新 日本語-手話辞典』（約10,270語収録）の見出し語数は、広辞苑の約何％？',
                    answer: 4,
                    source: '全日本ろうあ連盟発行・全国手話研修センター編集『新 日本語-手話辞典』（2023年発行）',
                    explanation: '約10,270語 ÷ 約250,000語 ＝ 4.1%（初版の約8,320語時点では約3.3%）。手話は表情や空間・動きの工夫で多様な意味を表す言語であることがわかります。'
                },
                {
                    question: '都道府県では89%が制定している「手話言語条例」ですが、より身近な全国の市区町村（1,741市区町村）のうち、すでに条例を制定している市区町村は約何％？',
                    answer: 36,
                    source: '一般財団法人 全日本ろうあ連盟「手話言語条例マップ」（https://www.jfd.or.jp/s-jourei）',
                    explanation: '1,741市区町村のうち630市区町村（22区・423市・164町・21村）が制定しており、割合は36.2%（約3分の1）です。'
                }
            ]
        },
        shuwa_hard: {
            name: '手話クイズ【難・上級】（全10問）',
            items: [
                {
                    question: '難関資格として知られる「第34回（令和5年度）手話通訳技能認定試験（手話通訳士試験）」において、受験者1,041名のうち合格した人の割合（合格率）は約何％？',
                    answer: 12,
                    source: '社会福祉法人 聴力障害者情報文化センター「第34回手話通訳技能認定試験結果」（2024年1月31日発表）',
                    explanation: '受験者数1,041名に対し合格者数は127名で、合格率は12.2%。高度な専門知識と実技が求められる難関試験です。'
                },
                {
                    question: '字幕放送は9割近く普及していますが、では手話番組が多いイメージのある「NHK Eテレ」において、1日の対象放送時間のうち「手話放送」が付いている番組の割合は約何％？',
                    answer: 3,
                    source: '総務省 情報流通行政局「令和4年度 放送番組の字幕・解説・手話付与実績」（2023年12月公表）',
                    explanation: '正確には2.81%（年間210時間35分）。NHK総合（0.59%）や民放キー局平均（0.25%）に比べると高いものの、Eテレでも全体の約3%にとどまります。'
                },
                {
                    question: '厚生労働省の実態調査において、身体障害者手帳（聴覚障害）を持つ65歳未満の人のうち、普段のコミュニケーション手段として「手話・手話通訳」を使っている人は約何％？',
                    answer: 25,
                    source: '厚生労働省「平成28年 生活のしづらさなどに関する調査（全国在宅障害児・者等実態調査）」',
                    explanation: '65歳未満では25.0%（4人に1人）。聴覚障害者には難聴や中途失聴の方も多いため、補聴器（25.0%）や筆談・要約筆記（22.9%）など多様な手段が使われています。'
                },
                {
                    question: '65歳未満の聴覚障害者では25%が手話を使っていますが、では加齢による難聴なども多い「65歳以上」の聴覚障害者において、「手話・手話通訳」を使っている人は約何％？',
                    answer: 4,
                    source: '厚生労働省「平成28年 生活のしづらさなどに関する調査（全国在宅障害児・者等実態調査）」',
                    explanation: '65歳以上では4.3%と大きく下がります。高齢になってから聞こえにくくなった方が多いため、補聴器や筆談による支援が中心となります。'
                },
                {
                    question: '同じ厚生労働省の調査で、65歳未満の聴覚障害者がコミュニケーション手段として「スマートフォン・タブレット端末」を活用している割合は約何％？',
                    answer: 21,
                    source: '厚生労働省「平成28年 生活のしづらさなどに関する調査（全国在宅障害児・者等実態調査）」',
                    explanation: '65歳未満では20.8%（約5人に1人）がスマホやタブレットを活用しています（一方、65歳以上では0.5%にとどまります）。'
                },
                {
                    question: '全国の聴覚特別支援学校（聾学校）に通う幼児・児童・生徒（5,273名）のうち、手術で内耳に電極を入れる「人工内耳」を装用している子どもは約何％？',
                    answer: 33,
                    source: '全国聾学校長会「令和2年度 全国聾学校児童生徒の実態調査」（筑波大学等の研究報告）',
                    explanation: '全国の在籍者5,273名中、人工内耳装用者は1,713名で32.5%（約3人に1人）。早期発見と医療技術の進歩により装用児が増えています。'
                },
                {
                    question: '現在（令和2年度調査）は聾学校の子どもの約33%が人工内耳を装用していますが、その12年前である2008年（平成20年度）当時は約何％だったでしょうか？',
                    answer: 11,
                    source: '全国聾学校長会「全国聾学校児童生徒の実態調査（経年推移データ）」',
                    explanation: '平成20年度（2008年度）は695名で10.9%でした。わずか12年間で10.9%から32.5%へと約3倍に増加しています。'
                },
                {
                    question: 'NHK総合（92%）や東京の民放キー局（70%）では字幕放送が進んでいますが、地方の独立県域テレビ局（全国13局平均）で、1日の総放送時間のうち字幕が付いている割合は約何％？',
                    answer: 18,
                    source: '総務省「令和5年度 放送番組の字幕・解説・手話付与実績」（2024年10月公表）',
                    explanation: '独立県域局（13局平均）の総放送時間に占める字幕付与率は18.2%（対象番組ベースでは46.5%）で、キー局との地域格差が課題となっています。'
                },
                {
                    question: '厚生労働省の調査で、全国で「聴覚・平衡機能障害」の身体障害者手帳を持っている人（約34.1万人）のうち、「65歳以上」の高齢者が占める割合は約何％？',
                    answer: 72,
                    source: '厚生労働省「平成28年 生活のしづらさなどに関する調査（全国在宅障害児・者等実態調査）」',
                    explanation: '手帳所持者約34万1千人のうち、65歳以上が72.4%と7割以上を占めており、聴覚障害分野でも高齢化への対応が重要となっています。'
                },
                {
                    question: '大会開催時には認知度が73%に達した「東京2025デフリンピック」ですが、開催2年前（令和5年度）の東京都の調査では、知っていた都民は約何％だったでしょうか？',
                    answer: 15,
                    source: '東京都「令和5年度 都民のスポーツ活動に関する実態調査」（2024年3月公表）',
                    explanation: '開催2年前の時点では14.8%でした。そこから開催1年前に39.0%、大会開催時に73.1%へと認知度が劇的に広がりました。'
                }
            ]
        },
        preset_general: {
            name: 'テスト用①（一般常識：日常・ライフスタイル編）',
            items: [
                {
                    question: 'スマートフォンを毎日3時間以上使っている人の割合は？',
                    answer: 68,
                    source: 'テスト用サンプル統計（ライフスタイル調査①）',
                    explanation: 'テスト用①の第1問解説です。動画視聴やSNSの普及により、1日3時間以上利用する人が約7割に達しています。'
                },
                {
                    question: '朝食を毎日必ず食べている成人の割合は？',
                    answer: 74,
                    source: 'テスト用サンプル統計（ライフスタイル調査②）',
                    explanation: 'テスト用①の第2問解説です。成人全体では約74%が毎日朝食を摂取しています。'
                },
                {
                    question: 'キャッシュレス決済を普段メインで使っている人の割合は？',
                    answer: 62,
                    source: 'テスト用サンプル統計（ライフスタイル調査③）',
                    explanation: 'テスト用①の第3問解説です。QRコード決済やクレジットカードなど、6割以上がキャッシュレス派です。'
                },
                {
                    question: '週に1回以上、自分で料理（自炊）をする人の割合は？',
                    answer: 58,
                    source: 'テスト用サンプル統計（ライフスタイル調査④）',
                    explanation: 'テスト用①の第4問解説です。週末だけ料理する人も含めると約6割が週1回以上自炊をしています。'
                },
                {
                    question: '猫よりも犬が好きだと答えた人の割合は？',
                    answer: 53,
                    source: 'テスト用サンプル統計（ライフスタイル調査⑤）',
                    explanation: 'テスト用①の第5問解説です。犬派53%・猫派47%と、ほぼ半々に分かれる結果となっています。'
                }
            ]
        },
        preset_trivia: {
            name: 'テスト用②（一般常識：おもしろ雑学・アンケート編）',
            items: [
                {
                    question: '目玉焼きには「醤油」をかける派の人の割合は？',
                    answer: 47,
                    source: 'テスト用サンプル統計（雑学アンケート①）',
                    explanation: 'テスト用②の第1問解説です。醤油派が約47%で1位、次いで塩コショウ派、ソース派と続きます。'
                },
                {
                    question: '旅行に行くなら「国内旅行」を選んだ人の割合は？',
                    answer: 79,
                    source: 'テスト用サンプル統計（雑学アンケート②）',
                    explanation: 'テスト用②の第2問解説です。温泉やグルメを手軽に楽しめる国内旅行が約8割の支持を集めています。'
                },
                {
                    question: 'スマホのアラームを「スヌーズ（二度寝防止）」設定している人の割合は？',
                    answer: 64,
                    source: 'テスト用サンプル統計（雑学アンケート③）',
                    explanation: 'テスト用②の第3問解説です。6割以上の人が5分〜10分おきに複数回アラームを鳴らしています。'
                },
                {
                    question: 'コンビニに行くと予定外のものを買ってしまう人の割合は？',
                    answer: 81,
                    source: 'テスト用サンプル統計（雑学アンケート④）',
                    explanation: 'テスト用②の第4問解説です。新作スイーツやホットスナックなど、8割以上がつい予定外の買い物をしています。'
                },
                {
                    question: '宝くじを1回以上買ったことがある成人の割合は？',
                    answer: 72,
                    source: 'テスト用サンプル統計（雑学アンケート⑤）',
                    explanation: 'テスト用②の第5問解説です。年末ジャンボなどを中心に、成人の約7割が購入経験を持っています。'
                }
            ]
        }
    };

    // Game State
    const state = {
        totalQuestions: 5,
        initialBalloons: 100,
        perfectBonus: 0,
        currentQuestion: 1,
        remainingBalloons: 100,
        phase: 'SETUP', // SETUP | INPUT_ANSWER | ANSWER_LOCKED | CORRECT_REVEALED | POPPING | QUESTION_DONE | GAME_OVER | GAME_CLEAR
        currentAnswer: null,
        currentCorrect: null,
        presetCorrect: null,
        currentRespondent: '',
        currentQuestionText: '',
        currentSource: '',
        currentExplanation: '',
        explanationVisible: false,
        questionBannerHidden: false,
        questionBank: [],     // Array of { question, answer, source, explanation }
        customCsvBank: [],    // Loaded from user's local .csv file
        customCsvName: '',
        historyLogs: [],      // Completed question records
        undoSnapshots: []     // Snapshots for Undo button
    };

    let activeTimer = null;
    let controllerPopup = null;
    const processedCmdIds = new Set();
    let syncChannel = null;
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            syncChannel = new BroadcastChannel('percent_balloon_sync');
        }
    } catch (_) {}

    // DOM Elements
    const el = {
        // HUD
        currentQNum: document.getElementById('current-q-num'),
        totalQNum: document.getElementById('total-q-num'),
        remainingQCount: document.getElementById('remaining-q-count'),
        questionDots: document.getElementById('question-dots'),
        questionTextBanner: document.getElementById('question-text-banner'),
        qTelopTag: document.getElementById('q-telop-tag'),
        displayRespondentBadge: document.getElementById('display-respondent-badge'),
        displayQuestionText: document.getElementById('display-question-text'),
        displayQuestionSource: document.getElementById('display-question-source'),
        balloonCounterCard: document.getElementById('balloon-counter-card'),
        remainingBalloonsNum: document.getElementById('remaining-balloons-num'),
        balloonGaugeBar: document.getElementById('balloon-gauge-bar'),

        // Monitors & Explanation Panel
        playerMonitor: document.getElementById('player-monitor'),
        playerMonitorTitle: document.getElementById('player-monitor-title'),
        displayAnswerVal: document.getElementById('display-answer-val'),
        correctMonitor: document.getElementById('correct-monitor'),
        displayCorrectVal: document.getElementById('display-correct-val'),
        diffCenterBadge: document.getElementById('diff-center-badge'),
        displayDiffVal: document.getElementById('display-diff-val'),
        explanationPanel: document.getElementById('explanation-panel'),
        displayExplanationText: document.getElementById('display-explanation-text'),
        displayExplanationSource: document.getElementById('display-explanation-source'),
        btnCloseExplanation: document.getElementById('btn-close-explanation'),

        // Setup Modal & CSV Controls
        setupModal: document.getElementById('setup-modal'),
        setupPresetSelect: document.getElementById('setup-preset-select'),
        setupCsvFile: document.getElementById('setup-csv-file'),
        csvLoadedInfo: document.getElementById('csv-loaded-info'),
        csvLoadedStatus: document.getElementById('csv-loaded-status'),
        btnClearCsv: document.getElementById('btn-clear-csv'),
        setupQuestionCountRow: document.getElementById('setup-question-count-row'),
        setupQDesc: document.getElementById('setup-q-desc'),
        setupTotalQuestions: document.getElementById('setup-total-questions'),
        setupInitialBalloons: document.getElementById('setup-initial-balloons'),
        setupPerfectBonus: document.getElementById('setup-perfect-bonus'),
        chkOpenPopupOnStart: document.getElementById('chk-open-popup-on-start'),
        btnStartGame: document.getElementById('btn-start-game'),

        // Result & Cut-ins
        cutinPerfect: document.getElementById('cutin-perfect'),
        perfectBonusText: document.getElementById('perfect-bonus-text'),
        resultModal: document.getElementById('result-modal'),
        resultCard: document.getElementById('result-card'),
        resultBadge: document.getElementById('result-badge'),
        resultTitle: document.getElementById('result-title'),
        resultSubtitle: document.getElementById('result-subtitle'),
        finalBalloonsStat: document.getElementById('final-balloons-stat'),
        finalQuestionsStat: document.getElementById('final-questions-stat'),
        resultLogTable: document.getElementById('result-log-table'),
        btnCloseResult: document.getElementById('btn-close-result'),
        btnResultUndo: document.getElementById('btn-result-undo'),
        btnPlayAgain: document.getElementById('btn-play-again'),

        // Operator Dock & Floating Corner
        controlDock: document.getElementById('control-dock'),
        dockPhaseIndicator: document.getElementById('dock-phase-indicator'),
        btnOpenPopup: document.getElementById('btn-open-popup'),
        chkAutoPop: document.getElementById('chk-auto-pop'),
        chkBlindCorrect: document.getElementById('chk-blind-correct'),
        btnRunTest: document.getElementById('btn-run-test'),
        btnUndo: document.getElementById('btn-undo'),
        btnMute: document.getElementById('btn-mute'),
        btnOpenSetup: document.getElementById('btn-open-setup'),
        btnToggleDock: document.getElementById('btn-toggle-dock'),
        floatingCornerTools: document.getElementById('floating-corner-tools'),
        btnCornerTitle: document.getElementById('btn-corner-title'),
        btnRestorePopup: document.getElementById('btn-restore-popup'),
        btnRestoreDock: document.getElementById('btn-restore-dock'),

        inputRespondent: document.getElementById('input-respondent'),
        inputQuestionText: document.getElementById('input-question-text'),
        inputAnswer: document.getElementById('input-answer'),
        inputCorrect: document.getElementById('input-correct'),

        btnLockAnswer: document.getElementById('btn-lock-answer'),
        btnRevealCorrect: document.getElementById('btn-reveal-correct'),
        btnPopBalloons: document.getElementById('btn-pop-balloons'),
        btnToggleExplanation: document.getElementById('btn-toggle-explanation'),
        btnToggleResult: document.getElementById('btn-toggle-result'),
        btnNextQuestion: document.getElementById('btn-next-question')
    };

    // Default blind input checkbox ON so the projection screen never leaks the correct answer
    el.chkBlindCorrect.checked = true;
    el.inputCorrect.type = 'password';

    // Initialize preview balloons in background and apply default preset selection
    engine.initBalloons(100);
    applyQuestionSetSelection();

    // =========================================
    // CSV PARSER & QUESTION SET SELECTION
    // =========================================
    function parseCSVContent(text) {
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        const items = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#')) continue;

            // Parse CSV row handling optional quotes
            const cols = [];
            let cur = '';
            let inQuotes = false;
            for (let c = 0; c < line.length; c++) {
                const ch = line[c];
                if (ch === '"') {
                    inQuotes = !inQuotes;
                } else if ((ch === ',' || ch === '\t' || ch === '，') && !inQuotes) {
                    cols.push(cur.trim());
                    cur = '';
                } else {
                    cur += ch;
                }
            }
            cols.push(cur.trim());

            if (cols.length >= 2) {
                const qText = cols[0].replace(/^["']|["']$/g, '').trim();
                const ansClean = cols[1].replace(/[%％"']/g, '').trim();
                const ansNum = parseInt(ansClean, 10);
                const srcText = cols[2] ? cols[2].replace(/^["']|["']$/g, '').trim() : '';
                const expText = cols[3] ? cols[3].replace(/^["']|["']$/g, '').trim() : '';

                // Skip header line like "問題文,正解"
                if (i === 0 && isNaN(ansNum)) continue;

                if (qText && !isNaN(ansNum)) {
                    items.push({
                        question: qText,
                        answer: Math.max(0, Math.min(100, ansNum)),
                        source: srcText,
                        explanation: expText
                    });
                }
            }
        }
        return items;
    }

    function applyQuestionSetSelection() {
        const mode = el.setupPresetSelect.value;

        if (mode === 'manual') {
            state.questionBank = [];
            el.csvLoadedInfo.classList.add('hidden');
            el.setupQDesc.textContent = '手動モード：この問題数を終えた時点で風船が1個でも残っていればGAME CLEAR';
        } else if (PRESET_SETS[mode]) {
            const preset = PRESET_SETS[mode];
            state.questionBank = preset.items.map(x => ({ ...x }));
            el.setupTotalQuestions.value = state.questionBank.length;
            el.csvLoadedStatus.textContent = `✅ 「${preset.name}」（全${state.questionBank.length}問）をセットしました`;
            el.csvLoadedInfo.classList.remove('hidden');
            el.setupQDesc.textContent = `選択した問題セット（全${state.questionBank.length}問）に合わせて自動設定されました`;
        } else if (mode === 'custom_csv') {
            if (state.customCsvBank.length > 0) {
                state.questionBank = state.customCsvBank.map(x => ({ ...x }));
                el.setupTotalQuestions.value = state.questionBank.length;
                el.csvLoadedStatus.textContent = `✅ CSV「${state.customCsvName}」（全${state.questionBank.length}問）を読み込みました`;
                el.csvLoadedInfo.classList.remove('hidden');
                el.setupQDesc.textContent = `読み込んだCSVの問題数（全${state.questionBank.length}問）に自動設定されました`;
            } else {
                // Trigger file dialog if not loaded yet
                el.setupCsvFile.click();
            }
        }
    }

    el.setupPresetSelect.addEventListener('change', applyQuestionSetSelection);

    el.setupCsvFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
            if (state.customCsvBank.length === 0) {
                el.setupPresetSelect.value = 'manual';
                applyQuestionSetSelection();
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const rawBuffer = ev.target.result;
            // Try UTF-8 first; if replacement characters appear, fallback to Shift_JIS (common for Excel CSV in Japan)
            let text = new TextDecoder('utf-8').decode(rawBuffer);
            if (text.includes('\uFFFD')) {
                try {
                    text = new TextDecoder('shift_jis').decode(rawBuffer);
                } catch (_) {}
            }

            const parsed = parseCSVContent(text);
            if (parsed.length === 0) {
                alert('CSVから「問題文, 正解数値」を読み取れませんでした。\n1列目に問題文、2列目に0〜100の数字が入っているか確認してください。');
                el.setupPresetSelect.value = 'manual';
                applyQuestionSetSelection();
                return;
            }

            state.customCsvBank = parsed;
            state.customCsvName = file.name;
            el.setupPresetSelect.value = 'custom_csv';
            applyQuestionSetSelection();
            sound.playClick();
        };
        reader.readAsArrayBuffer(file);
    });

    el.btnClearCsv.addEventListener('click', () => {
        state.customCsvBank = [];
        state.customCsvName = '';
        el.setupCsvFile.value = '';
        el.setupPresetSelect.value = 'manual';
        applyQuestionSetSelection();
    });

    // =========================================
    // POPUP CONTROLLER WINDOW & SYNC
    // =========================================
    function openControllerPopupWindow() {
        const width = 760;
        const height = 640;
        const left = Math.max(0, window.screen.availWidth - width - 30);
        const top = 40;

        controllerPopup = window.open(
            'controller.html',
            'PercentBalloonController',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        // Hide the bottom dock on the projection display so the audience only sees the show screen
        minimizeDock(true);
        setTimeout(broadcastStateToController, 250);
    }

    el.btnOpenPopup.addEventListener('click', () => {
        sound.playClick();
        openControllerPopupWindow();
    });

    el.btnRestorePopup.addEventListener('click', () => {
        sound.playClick();
        openControllerPopupWindow();
    });

    function broadcastStateToController() {
        const payloadState = {
            totalQuestions: state.totalQuestions,
            initialBalloons: state.initialBalloons,
            currentQuestion: state.currentQuestion,
            remainingBalloons: state.remainingBalloons,
            phase: state.phase,
            currentAnswer: state.currentAnswer,
            currentCorrect: state.currentCorrect,
            presetCorrect: state.presetCorrect,
            currentSource: state.currentSource,
            currentExplanation: state.currentExplanation,
            hasExplanation: Boolean(state.currentExplanation),
            explanationVisible: state.explanationVisible,
            resultModalVisible: el.resultModal ? !el.resultModal.classList.contains('hidden') : false,
            currentRespondent: el.inputRespondent.value,
            currentQuestionText: el.inputQuestionText.value,
            questionBank: state.questionBank,
            canUndo: state.undoSnapshots.length > 0,
            muted: sound.muted
        };

        const syncPacket = { type: 'PB_STATE_SYNC', state: payloadState, ts: Date.now() };

        if (syncChannel) {
            try {
                syncChannel.postMessage({ type: 'STATE_SYNC', state: payloadState });
            } catch (_) {}
        }
        if (controllerPopup && !controllerPopup.closed) {
            try {
                if (typeof controllerPopup.receiveDisplayState === 'function') {
                    controllerPopup.receiveDisplayState(payloadState);
                }
            } catch (_) {}
            try {
                controllerPopup.postMessage(syncPacket, '*');
            } catch (_) {}
        }
        try {
            localStorage.setItem('pb_state_bridge', JSON.stringify(syncPacket));
        } catch (_) {}
    }

    function normalizeDigits(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
            .replace(/[^0-9]/g, '');
    }

    function handleControllerCommand(action, payload = {}, cmdId = null) {
        if (cmdId) {
            if (processedCmdIds.has(cmdId)) return;
            processedCmdIds.add(cmdId);
            if (processedCmdIds.size > 200) {
                const first = processedCmdIds.values().next().value;
                processedCmdIds.delete(first);
            }
        }

        switch (action) {
            case 'REQUEST_STATE':
                broadcastStateToController();
                break;
            case 'UPDATE_TEXT':
                if (payload.respondent !== undefined) el.inputRespondent.value = payload.respondent;
                if (payload.questionText !== undefined) el.inputQuestionText.value = payload.questionText;
                state.questionBannerHidden = false;
                syncOptionalBanner();
                broadcastStateToController();
                break;
            case 'TOGGLE_QUESTION_BANNER':
                state.questionBannerHidden = !state.questionBannerHidden;
                syncOptionalBanner();
                break;
            case 'TOGGLE_EXPLANATION':
                toggleExplanationPanel();
                break;
            case 'TOGGLE_RESULT_MODAL':
                toggleResultModal();
                break;
            case 'SELECT_QUESTION_INDEX':
                if (state.phase !== 'POPPING' && state.questionBank[payload.index]) {
                    state.currentQuestion = payload.index + 1;
                    prepareQuestionRound();
                }
                break;
            case 'LOCK_ANSWER':
                if (payload.respondent !== undefined) el.inputRespondent.value = payload.respondent;
                if (payload.questionText !== undefined) el.inputQuestionText.value = payload.questionText;
                if (payload.answer !== undefined) {
                    el.inputAnswer.value = normalizeDigits(payload.answer);
                }
                lockAnswer();
                break;
            case 'REVEAL_CORRECT':
                if (payload.correct !== undefined && normalizeDigits(payload.correct) !== '') {
                    el.inputCorrect.value = normalizeDigits(payload.correct);
                }
                if (payload.autoPop !== undefined && el.chkAutoPop) {
                    el.chkAutoPop.checked = !!payload.autoPop;
                }
                revealCorrectAnswer();
                break;
            case 'POP_BALLOONS':
                startBalloonMeasurement();
                break;
            case 'NEXT_QUESTION':
                if (state.phase === 'QUESTION_DONE') {
                    sound.playClick();
                    saveSnapshot();
                    state.currentQuestion++;
                    prepareQuestionRound();
                }
                break;
            case 'UNDO':
                performUndo();
                break;
            case 'TOGGLE_MUTE':
                el.btnMute.click();
                broadcastStateToController();
                break;
            case 'OPEN_SETUP':
                returnToTitleScreen();
                break;
        }
    }

    window.receiveControllerCommand = handleControllerCommand;

    window.addEventListener('message', (ev) => {
        if (ev.data && ev.data.type === 'PB_CMD') {
            handleControllerCommand(ev.data.action, ev.data.payload, ev.data.cmdId);
        }
    });

    window.addEventListener('storage', (ev) => {
        if (ev.key === 'pb_cmd_bridge' && ev.newValue) {
            try {
                const data = JSON.parse(ev.newValue);
                if (data && data.type === 'PB_CMD') {
                    handleControllerCommand(data.action, data.payload, data.cmdId);
                }
            } catch (_) {}
        }
    });

    if (syncChannel) {
        syncChannel.onmessage = (ev) => {
            if (ev.data && ev.data.type === 'CMD') {
                handleControllerCommand(ev.data.action, ev.data.payload, ev.data.cmdId);
            }
        };
    }

    // =========================================
    // SETUP & INITIALIZATION
    // =========================================
    document.querySelectorAll('.stepper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sound.playClick();
            const targetId = btn.getAttribute('data-target');
            const step = parseInt(btn.getAttribute('data-step'), 10);
            const input = document.getElementById(targetId);
            if (!input) return;

            const min = parseInt(input.min, 10) || 0;
            const max = parseInt(input.max, 10) || 200;
            let val = parseInt(input.value, 10) || 0;
            val = Math.max(min, Math.min(max, val + step));
            input.value = val;
        });
    });

    el.btnStartGame.addEventListener('click', () => {
        sound.playClick();
        const shouldOpenPopup = el.chkOpenPopupOnStart && el.chkOpenPopupOnStart.checked;
        startNewGame();
        if (shouldOpenPopup) {
            openControllerPopupWindow();
        }
    });

    function returnToTitleScreen() {
        sound.playClick();
        clearActiveTimer();
        sound.stopDrumroll();
        el.cutinPerfect.classList.add('hidden');
        el.resultModal.classList.add('hidden');
        state.explanationVisible = false;
        syncExplanationPanel();
        syncResultModalControls();
        el.setupModal.classList.remove('hidden');
        state.phase = 'SETUP';
        updateControlButtons();
        broadcastStateToController();
    }

    el.btnOpenSetup.addEventListener('click', returnToTitleScreen);
    el.btnPlayAgain.addEventListener('click', returnToTitleScreen);
    if (el.btnCornerTitle) {
        el.btnCornerTitle.addEventListener('click', returnToTitleScreen);
    }

    function startNewGame() {
        clearActiveTimer();

        let qCount = clampInt(el.setupTotalQuestions.value, 1, 50, 5);
        if (state.questionBank.length > 0) {
            qCount = Math.min(qCount, state.questionBank.length);
        }

        const bCount = clampInt(el.setupInitialBalloons.value, 1, 300, 100);
        const pBonus = clampInt(el.setupPerfectBonus.value, 0, 100, 0);

        state.totalQuestions = qCount;
        state.initialBalloons = bCount;
        state.perfectBonus = pBonus;
        state.currentQuestion = 1;
        state.remainingBalloons = bCount;
        state.historyLogs = [];
        state.undoSnapshots = [];

        engine.initBalloons(bCount);
        el.setupModal.classList.add('hidden');
        el.resultModal.classList.add('hidden');
        el.cutinPerfect.classList.add('hidden');

        prepareQuestionRound();
        updateAllHUD();
    }

    function prepareQuestionRound() {
        state.phase = 'INPUT_ANSWER';
        state.currentAnswer = null;
        state.currentCorrect = null;
        state.questionBannerHidden = false;

        el.inputAnswer.value = '';
        el.inputRespondent.value = '';

        // Check if current question exists in loaded CSV / Preset questionBank
        const qItem = state.questionBank[state.currentQuestion - 1];
        if (qItem) {
            el.inputQuestionText.value = qItem.question;
            el.inputCorrect.value = qItem.answer;
            state.presetCorrect = qItem.answer;
            state.currentSource = qItem.source || '';
            state.currentExplanation = qItem.explanation || '';
        } else {
            el.inputQuestionText.value = '';
            el.inputCorrect.value = '';
            state.presetCorrect = null;
            state.currentSource = '';
            state.currentExplanation = '';
        }
        state.explanationVisible = false;

        el.displayAnswerVal.textContent = '--';
        el.displayCorrectVal.textContent = '?';
        el.playerMonitor.classList.remove('active-glow');
        el.correctMonitor.classList.remove('active-glow');
        el.diffCenterBadge.classList.add('hidden');
        el.diffCenterBadge.classList.remove('perfect-diff');

        syncOptionalBanner();
        syncExplanationPanel();
        updateControlButtons();
        updateAllHUD();
        el.inputAnswer.focus();
    }

    // =========================================
    // SNAPSHOT / UNDO MANAGEMENT
    // =========================================
    function saveSnapshot() {
        state.undoSnapshots.push({
            currentQuestion: state.currentQuestion,
            remainingBalloons: state.remainingBalloons,
            phase: state.phase,
            currentAnswer: state.currentAnswer,
            currentCorrect: state.currentCorrect,
            presetCorrect: state.presetCorrect,
            currentSource: state.currentSource,
            currentExplanation: state.currentExplanation,
            explanationVisible: state.explanationVisible,
            currentRespondent: el.inputRespondent.value,
            currentQuestionText: el.inputQuestionText.value,
            historyLogs: JSON.parse(JSON.stringify(state.historyLogs))
        });
        el.btnUndo.disabled = false;
    }

    function performUndo() {
        if (state.undoSnapshots.length === 0) return;
        clearActiveTimer();
        sound.stopDrumroll();
        sound.playClick();

        const snap = state.undoSnapshots.pop();
        state.currentQuestion = snap.currentQuestion;
        state.remainingBalloons = snap.remainingBalloons;
        state.phase = snap.phase;
        state.currentAnswer = snap.currentAnswer;
        state.currentCorrect = snap.currentCorrect;
        state.presetCorrect = snap.presetCorrect;
        state.currentSource = snap.currentSource || '';
        state.currentExplanation = snap.currentExplanation || '';
        state.explanationVisible = Boolean(snap.explanationVisible);
        state.historyLogs = snap.historyLogs;

        el.inputRespondent.value = snap.currentRespondent || '';
        el.inputQuestionText.value = snap.currentQuestionText || '';
        el.inputAnswer.value = snap.currentAnswer !== null ? snap.currentAnswer : '';
        if (snap.currentCorrect !== null) {
            el.inputCorrect.value = snap.currentCorrect;
        } else if (snap.presetCorrect !== null && snap.presetCorrect !== undefined) {
            el.inputCorrect.value = snap.presetCorrect;
        } else {
            el.inputCorrect.value = '';
        }

        // Rebuild balloons in Canvas to match restored count
        engine.initBalloons(state.remainingBalloons);
        engine.maxBalloons = state.initialBalloons;
        engine.recalculateBalloonLayout();

        // Hide modals/cutins
        el.resultModal.classList.add('hidden');
        el.cutinPerfect.classList.add('hidden');

        // Restore monitor displays
        el.displayAnswerVal.textContent = state.currentAnswer !== null ? state.currentAnswer : '--';
        el.displayCorrectVal.textContent = state.currentCorrect !== null ? state.currentCorrect : '?';

        if (state.currentAnswer !== null && state.currentCorrect !== null) {
            const diff = Math.abs(state.currentAnswer - state.currentCorrect);
            el.displayDiffVal.textContent = diff;
            el.diffCenterBadge.classList.remove('hidden');
            el.diffCenterBadge.classList.toggle('perfect-diff', diff === 0);
        } else {
            el.diffCenterBadge.classList.add('hidden');
        }

        syncOptionalBanner();
        syncExplanationPanel();
        updateAllHUD();
        updateControlButtons();
        el.btnUndo.disabled = state.undoSnapshots.length === 0;
        broadcastStateToController();
    }

    el.btnUndo.addEventListener('click', performUndo);
    el.btnResultUndo.addEventListener('click', performUndo);

    // =========================================
    // STEP 1: LOCK & DISPLAY RESPONDENT ANSWER
    // =========================================
    function syncOptionalBanner() {
        const resp = el.inputRespondent.value.trim();
        const qText = el.inputQuestionText.value.trim();

        if (el.qTelopTag) {
            el.qTelopTag.textContent = `QUESTION ${state.currentQuestion}`;
        }

        if (resp) {
            el.playerMonitorTitle.textContent = `${resp} の回答予想`;
            el.displayRespondentBadge.textContent = `回答者: ${resp}`;
            el.displayRespondentBadge.classList.remove('hidden');
        } else {
            el.playerMonitorTitle.textContent = 'ANSWER（回答予想）';
            el.displayRespondentBadge.classList.add('hidden');
        }

        if (el.displayQuestionSource) {
            if (state.currentSource) {
                el.displayQuestionSource.textContent = `出典：${state.currentSource}`;
                el.displayQuestionSource.classList.remove('hidden');
            } else {
                el.displayQuestionSource.textContent = '';
                el.displayQuestionSource.classList.add('hidden');
            }
        }

        if (!state.questionBannerHidden && (qText || resp)) {
            el.displayQuestionText.textContent = qText || `第${state.currentQuestion}問`;
            el.questionTextBanner.classList.remove('hidden');
        } else {
            el.questionTextBanner.classList.add('hidden');
        }
    }

    function syncExplanationPanel() {
        const hasExp = Boolean(state.currentExplanation);
        const canShowButton = hasExp && ['CORRECT_REVEALED', 'POPPING', 'QUESTION_DONE', 'GAME_OVER', 'GAME_CLEAR'].includes(state.phase);

        if (el.explanationPanel) {
            if (hasExp && state.explanationVisible) {
                el.displayExplanationText.textContent = state.currentExplanation;
                if (el.displayExplanationSource) {
                    el.displayExplanationSource.textContent = state.currentSource ? `出典：${state.currentSource}` : '';
                    el.displayExplanationSource.classList.toggle('hidden', !state.currentSource);
                }
                el.explanationPanel.classList.remove('hidden');
            } else {
                el.explanationPanel.classList.add('hidden');
            }
        }

        if (el.btnToggleExplanation) {
            if (canShowButton) {
                el.btnToggleExplanation.classList.remove('hidden');
                el.btnToggleExplanation.textContent = state.explanationVisible ? '💡 解説を隠す' : '💡 解説を見る';
            } else {
                el.btnToggleExplanation.classList.add('hidden');
            }
        }
    }

    function toggleExplanationPanel(forceState) {
        if (!state.currentExplanation) return;
        sound.playClick();
        if (typeof forceState === 'boolean') {
            state.explanationVisible = forceState;
        } else {
            state.explanationVisible = !state.explanationVisible;
        }
        syncExplanationPanel();
        broadcastStateToController();
    }

    if (el.btnToggleExplanation) {
        el.btnToggleExplanation.addEventListener('click', () => toggleExplanationPanel());
    }
    if (el.btnCloseExplanation) {
        el.btnCloseExplanation.addEventListener('click', () => toggleExplanationPanel(false));
    }

    function syncResultModalControls() {
        const isGameEnd = (state.phase === 'GAME_OVER' || state.phase === 'GAME_CLEAR');
        const isModalVisible = el.resultModal && !el.resultModal.classList.contains('hidden');
        if (el.btnToggleResult) {
            el.btnToggleResult.classList.toggle('hidden', !isGameEnd);
            if (isGameEnd) {
                el.btnToggleResult.textContent = isModalVisible ? '🏆 結果画面を隠す' : '🏆 結果画面を表示';
            }
        }
    }

    function toggleResultModal(forceState) {
        if (state.phase !== 'GAME_OVER' && state.phase !== 'GAME_CLEAR') return;
        sound.playClick();
        const currentlyVisible = !el.resultModal.classList.contains('hidden');
        const nextVisible = typeof forceState === 'boolean' ? forceState : !currentlyVisible;
        el.resultModal.classList.toggle('hidden', !nextVisible);
        syncResultModalControls();
        broadcastStateToController();
    }

    if (el.btnCloseResult) {
        el.btnCloseResult.addEventListener('click', () => toggleResultModal(false));
    }
    if (el.btnToggleResult) {
        el.btnToggleResult.addEventListener('click', () => toggleResultModal());
    }

    el.inputRespondent.addEventListener('input', () => {
        syncOptionalBanner();
        broadcastStateToController();
    });
    el.inputQuestionText.addEventListener('input', () => {
        syncOptionalBanner();
        broadcastStateToController();
    });

    el.btnLockAnswer.addEventListener('click', lockAnswer);
    el.inputAnswer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            lockAnswer();
        }
    });

    function lockAnswer() {
        if (state.phase === 'POPPING') return;
        const raw = normalizeDigits(el.inputAnswer.value);
        if (raw === '' || isNaN(Number(raw))) {
            shakeInput(el.inputAnswer);
            return;
        }

        saveSnapshot();
        const val = clampInt(raw, 0, 100, 50);
        el.inputAnswer.value = val;
        state.currentAnswer = val;
        state.phase = 'ANSWER_LOCKED';

        syncOptionalBanner();
        el.displayAnswerVal.textContent = val;
        el.playerMonitor.classList.add('active-glow');
        el.correctMonitor.classList.remove('active-glow');

        // Reset correct display if re-locking answer
        el.displayCorrectVal.textContent = '?';
        el.diffCenterBadge.classList.add('hidden');

        sound.playAnswerLock();
        updateControlButtons();
        broadcastStateToController();
        el.inputCorrect.focus();
    }

    // =========================================
    // STEP 2: REVEAL CORRECT ANSWER (DRUMROLL)
    // =========================================
    el.btnRevealCorrect.addEventListener('click', revealCorrectAnswer);
    el.inputCorrect.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!el.btnRevealCorrect.disabled) {
                revealCorrectAnswer();
            } else if (!el.btnPopBalloons.disabled) {
                startBalloonMeasurement();
            }
        }
    });

    function revealCorrectAnswer() {
        if (state.currentAnswer === null || state.phase === 'POPPING') return;
        let raw = normalizeDigits(el.inputCorrect.value);
        if ((raw === '' || isNaN(Number(raw))) && state.presetCorrect !== null) {
            raw = String(state.presetCorrect);
        }
        if (raw === '' || isNaN(Number(raw))) {
            shakeInput(el.inputCorrect);
            return;
        }

        saveSnapshot();
        const correctVal = clampInt(raw, 0, 100, 50);
        el.inputCorrect.value = correctVal;
        state.currentCorrect = correctVal;
        state.phase = 'POPPING'; // Temporarily lock during drumroll
        updateControlButtons();
        broadcastStateToController();

        el.playerMonitor.classList.remove('active-glow');
        el.correctMonitor.classList.add('active-glow');

        // Drumroll number roulette for 0.9 seconds
        sound.startDrumroll();
        let ticks = 0;
        const maxTicks = 18;
        clearActiveTimer();

        activeTimer = setInterval(() => {
            ticks++;
            if (ticks < maxTicks) {
                el.displayCorrectVal.textContent = Math.floor(Math.random() * 101);
            } else {
                clearActiveTimer();
                el.displayCorrectVal.textContent = correctVal;
                sound.playRevealHit();
                engine.shake(6);

                const diff = Math.abs(state.currentAnswer - state.currentCorrect);
                el.displayDiffVal.textContent = diff;
                el.diffCenterBadge.classList.remove('hidden');
                el.diffCenterBadge.classList.toggle('perfect-diff', diff === 0);

                state.phase = 'CORRECT_REVEALED';
                // Keep explanation hidden during drumroll & balloon popping / PERFECT cut-in;
                // it will automatically appear in finishQuestionRound() right after popping / PERFECT finishes!
                syncExplanationPanel();
                updateControlButtons();
                broadcastStateToController();
                el.btnPopBalloons.focus();

                // Automatically proceed to pop balloons if Auto-Pop is enabled (default: ON)
                if (!el.chkAutoPop || el.chkAutoPop.checked) {
                    activeTimer = setTimeout(() => {
                        if (state.phase === 'CORRECT_REVEALED') {
                            startBalloonMeasurement();
                        }
                    }, 750);
                }
            }
        }, 45);
    }

    // =========================================
    // STEP 3: POP BALLOONS BY DIFFERENCE
    // =========================================
    el.btnPopBalloons.addEventListener('click', startBalloonMeasurement);

    function startBalloonMeasurement() {
        if (state.phase !== 'CORRECT_REVEALED') return;

        saveSnapshot();
        state.phase = 'POPPING';
        updateControlButtons();
        broadcastStateToController();

        const diff = Math.abs(state.currentAnswer - state.currentCorrect);

        // Case A: PERFECT!! (0% Difference)
        if (diff === 0) {
            handlePerfectBonus();
            return;
        }

        // Case B: Pop balloons 1 by 1
        let poppedSoFar = 0;

        function popStep() {
            if (state.remainingBalloons <= 0 || poppedSoFar >= diff) {
                finishQuestionRound(poppedSoFar, diff, false);
                return;
            }

            // Pop 1 balloon
            state.remainingBalloons = Math.max(0, state.remainingBalloons - 1);
            poppedSoFar++;

            engine.popOneBalloon();
            const ratio = state.remainingBalloons / Math.max(state.initialBalloons, 1);
            sound.playBalloonPop(ratio);

            if (state.remainingBalloons > 0 && state.remainingBalloons <= 10) {
                sound.playDangerBeep();
            }

            // Update remaining diff countdown & HUD
            el.displayDiffVal.textContent = diff - poppedSoFar;
            bumpBalloonCard();
            updateAllHUD();

            if (state.remainingBalloons <= 0 || poppedSoFar >= diff) {
                activeTimer = setTimeout(() => {
                    finishQuestionRound(poppedSoFar, diff, false);
                }, 400);
                return;
            }

            // Dynamic pacing
            const remainingToPop = diff - poppedSoFar;
            let delay = 115;
            if (diff > 35) delay = 65;
            else if (diff > 20) delay = 85;

            if (remainingToPop <= 3 || state.remainingBalloons <= 5) {
                delay = 220;
            }

            activeTimer = setTimeout(popStep, delay);
        }

        popStep();
    }

    function handlePerfectBonus() {
        sound.playPerfectFanfare();
        engine.spawnConfetti(70);

        const bonus = state.perfectBonus;
        if (bonus > 0) {
            el.perfectBonusText.textContent = `ボーナス風船 +${bonus}個！`;
        } else {
            el.perfectBonusText.textContent = `風船キープ！ノーダメージ！`;
        }
        el.cutinPerfect.classList.remove('hidden');

        activeTimer = setTimeout(() => {
            if (bonus > 0) {
                engine.addBonusBalloons(
                    bonus,
                    (addedIdx) => {
                        state.remainingBalloons++;
                        sound.playBalloonAdd(addedIdx);
                        bumpBalloonCard();
                        updateAllHUD();
                    },
                    () => {
                        setTimeout(() => {
                            el.cutinPerfect.classList.add('hidden');
                            finishQuestionRound(0, 0, true);
                        }, 900);
                    }
                );
            } else {
                setTimeout(() => {
                    el.cutinPerfect.classList.add('hidden');
                    finishQuestionRound(0, 0, true);
                }, 1300);
            }
        }, 900);
    }

    function finishQuestionRound(poppedCount, actualDiff, isPerfect) {
        clearActiveTimer();
        el.displayDiffVal.textContent = actualDiff;

        // Automatically display explanation right after balloon popping finishes or PERFECT cut-in disappears
        if (state.currentExplanation) {
            state.explanationVisible = true;
        }
        syncExplanationPanel();

        // Record history
        state.historyLogs.push({
            qNum: state.currentQuestion,
            respondent: el.inputRespondent.value.trim() || `回答者${state.currentQuestion}`,
            questionText: el.inputQuestionText.value.trim() || `第${state.currentQuestion}問`,
            answer: state.currentAnswer,
            correct: state.currentCorrect,
            diff: actualDiff,
            popped: poppedCount,
            isPerfect,
            afterBalloons: state.remainingBalloons
        });
        updateAllHUD();

        // 1. Check GAME OVER (0 Balloons Left)
        if (state.remainingBalloons <= 0) {
            triggerGameOver();
            return;
        }

        // 2. Check GAME CLEAR (All Questions Completed with >= 1 Balloon)
        if (state.currentQuestion >= state.totalQuestions) {
            triggerGameClear();
            return;
        }

        // 3. Otherwise ready for next question
        state.phase = 'QUESTION_DONE';
        updateControlButtons();
        broadcastStateToController();
        el.btnNextQuestion.focus();
    }

    // =========================================
    // NEXT QUESTION / GAME OVER / GAME CLEAR
    // =========================================
    el.btnNextQuestion.addEventListener('click', () => {
        if (state.phase !== 'QUESTION_DONE') return;
        sound.playClick();
        saveSnapshot();
        state.currentQuestion++;
        prepareQuestionRound();
    });

    function triggerGameOver() {
        state.phase = 'GAME_OVER';
        updateControlButtons();
        broadcastStateToController();
        engine.triggerGameOverFall();
        sound.playGameOver();

        activeTimer = setTimeout(() => {
            showResultModal(false);
        }, 1500);
    }

    function triggerGameClear() {
        state.phase = 'GAME_CLEAR';
        updateControlButtons();
        broadcastStateToController();
        engine.triggerGameClearRise();
        sound.playGameClear();

        activeTimer = setTimeout(() => {
            showResultModal(true);
        }, 1500);
    }

    function showResultModal(isClear) {
        el.resultCard.classList.toggle('gameover-theme', !isClear);
        if (isClear) {
            el.resultBadge.textContent = '🎉 CONGRATULATIONS 🎉';
            el.resultTitle.textContent = 'GAME CLEAR!!';
            el.resultSubtitle.textContent = `全${state.totalQuestions}問を突破し、風船を${state.remainingBalloons}個守り抜きました！`;
            el.finalQuestionsStat.textContent = `${state.totalQuestions} / ${state.totalQuestions}`;
        } else {
            el.resultBadge.textContent = '💥 BALLOONS ALL POPPED 💥';
            el.resultTitle.textContent = 'GAME OVER...';
            el.resultSubtitle.textContent = `第${state.currentQuestion}問で風船がすべて割れてしまいました…！`;
            el.finalQuestionsStat.textContent = `${Math.max(0, state.currentQuestion - 1)} / ${state.totalQuestions}`;
        }

        el.finalBalloonsStat.textContent = state.remainingBalloons;

        // Populate log rows ("第〇問で何個割れたか")
        el.resultLogTable.innerHTML = '';
        state.historyLogs.forEach(item => {
            const row = document.createElement('div');
            row.className = 'log-row';
            const popText = item.isPerfect
                ? `<span style="color:#00E676;font-weight:900;">🎉 ピタリ賞！ 0個破裂（+${state.perfectBonus}個追加）</span>`
                : `<span style="color:#FF8A80;font-weight:900;">💥 ${item.popped}個 割れた（誤差 ${item.diff}%）</span>`;
            row.innerHTML = `
                <span><strong>第${item.qNum}問</strong>：予想 <strong>${item.answer}%</strong> ／ 正解 <strong>${item.correct}%</strong></span>
                <span>${popText} ➡ 残り <strong>${item.afterBalloons}</strong>個</span>
            `;
            el.resultLogTable.appendChild(row);
        });

        el.resultModal.classList.remove('hidden');
        syncResultModalControls();
        broadcastStateToController();
    }

    // =========================================
    // UI UPDATES & UTILITIES
    // =========================================
    function updateAllHUD() {
        el.currentQNum.textContent = state.currentQuestion;
        el.totalQNum.textContent = state.totalQuestions;
        const completedCount = state.historyLogs.length;
        const remQ = Math.max(0, state.totalQuestions - completedCount);
        el.remainingQCount.textContent = remQ;

        // Question Dots
        el.questionDots.innerHTML = '';
        for (let i = 1; i <= state.totalQuestions; i++) {
            const dot = document.createElement('span');
            dot.className = 'q-dot';
            if (i <= completedCount) dot.classList.add('done');
            else if (i === state.currentQuestion) dot.classList.add('active');
            el.questionDots.appendChild(dot);
        }

        // Balloon HUD
        el.remainingBalloonsNum.textContent = state.remainingBalloons;
        const pct = Math.max(0, Math.min(100, (state.remainingBalloons / Math.max(state.initialBalloons, 1)) * 100));
        el.balloonGaugeBar.style.width = `${pct}%`;

        el.balloonGaugeBar.classList.remove('warning', 'danger');
        if (state.remainingBalloons <= 15) {
            el.balloonGaugeBar.classList.add('danger');
            el.balloonCounterCard.classList.add('danger');
        } else if (state.remainingBalloons <= 35) {
            el.balloonGaugeBar.classList.add('warning');
            el.balloonCounterCard.classList.remove('danger');
        } else {
            el.balloonCounterCard.classList.remove('danger');
        }

        broadcastStateToController();
    }

    function updateControlButtons() {
        const p = state.phase;

        const phaseLabels = {
            SETUP: '初期設定を行ってください',
            INPUT_ANSWER: `Q.${state.currentQuestion}: ① 回答者の予想(%)を入力して「回答を表示」を押してください`,
            ANSWER_LOCKED: `Q.${state.currentQuestion}: ② 正解の数値(%)を入力して「正解を発表！」を押してください`,
            CORRECT_REVEALED: `Q.${state.currentQuestion}: ③ 「バルーン計測！」で差分の風船が割れます！`,
            POPPING: '🎈 演出中...',
            QUESTION_DONE: `Q.${state.currentQuestion} 完了！「次の問題へ進む」を押してください`,
            GAME_OVER: '💥 GAME OVER',
            GAME_CLEAR: '🎉 GAME CLEAR!!'
        };
        el.dockPhaseIndicator.textContent = phaseLabels[p] || '';

        el.btnLockAnswer.disabled = (p === 'POPPING' || p === 'QUESTION_DONE' || p === 'GAME_OVER' || p === 'GAME_CLEAR');
        el.btnRevealCorrect.disabled = (p !== 'ANSWER_LOCKED' && p !== 'CORRECT_REVEALED');
        el.btnPopBalloons.disabled = (p !== 'CORRECT_REVEALED');

        if (p === 'QUESTION_DONE') {
            el.btnPopBalloons.classList.add('hidden');
            el.btnNextQuestion.classList.remove('hidden');
        } else {
            el.btnPopBalloons.classList.remove('hidden');
            el.btnNextQuestion.classList.add('hidden');
        }
        syncExplanationPanel();
        syncResultModalControls();
    }

    // Blind Correct Answer Toggle
    el.chkBlindCorrect.addEventListener('change', () => {
        el.inputCorrect.type = el.chkBlindCorrect.checked ? 'password' : 'text';
    });

    // Mute Toggle
    el.btnMute.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        el.btnMute.textContent = isMuted ? '🔇 ミュート中' : '🔊 音ON';
        broadcastStateToController();
    });

    // Dock Minimize / Restore (projection-viewport automatically expands/shrinks via flex + ResizeObserver)
    function minimizeDock(forceMin) {
        const isMin = el.controlDock.classList.toggle('minimized', forceMin);
        el.floatingCornerTools.classList.toggle('hidden', !isMin);
        requestAnimationFrame(() => engine.resize());
    }

    el.btnToggleDock.addEventListener('click', () => minimizeDock());
    el.btnRestoreDock.addEventListener('click', () => minimizeDock(false));

    document.addEventListener('keydown', (e) => {
        if ((e.key === 'h' || e.key === 'H') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            minimizeDock();
        }
    });

    function bumpBalloonCard() {
        el.balloonCounterCard.classList.add('pop-bump');
        setTimeout(() => el.balloonCounterCard.classList.remove('pop-bump'), 110);
    }

    function shakeInput(inputEl) {
        inputEl.style.borderColor = '#FF2A55';
        inputEl.focus();
        setTimeout(() => {
            inputEl.style.borderColor = '';
        }, 600);
    }

    function clearActiveTimer() {
        if (activeTimer) {
            clearInterval(activeTimer);
            clearTimeout(activeTimer);
            activeTimer = null;
        }
    }

    function clampInt(val, min, max, fallback) {
        const n = parseInt(val, 10);
        if (isNaN(n)) return fallback;
        return Math.max(min, Math.min(max, n));
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    // =========================================
    // BUILT-IN AUTOMATED SELF-TEST SUITE
    // =========================================
    async function runBuiltInSelfTest() {
        const prevMuted = sound.muted;
        sound.setMuted(true);
        const results = [];
        const check = (cond, name) => {
            results.push({ pass: !!cond, name });
            if (!cond) console.error('[TEST FAIL]', name);
        };

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        try {
            // 1. Test CSV Parser (4 columns: 問題文,正解,出典,解説) & Question Bank Auto-Loading
            const sampleCsv = "問題文,正解,出典,解説\nスマホを毎日3時間以上使う人の割合は？,68,総務省「情報通信白書」（2024年）,正確には68.2%です。\n朝食を毎日食べる人の割合は？,74,農林水産省「食育意識調査」（2024年）,正確には74.1%です。";
            const parsed = parseCSVContent(sampleCsv);
            check(
                parsed.length === 2 &&
                parsed[0].answer === 68 &&
                parsed[0].source.includes('総務省') &&
                parsed[0].explanation.includes('68.2%'),
                'CSVデータ（問題文, 正解, 出典, 解説）の4列パース検証'
            );

            state.customCsvBank = parsed;
            state.customCsvName = 'test.csv';
            el.setupPresetSelect.value = 'custom_csv';
            applyQuestionSetSelection();
            el.setupInitialBalloons.value = '30';
            el.setupPerfectBonus.value = '0';
            startNewGame();

            check(
                state.totalQuestions === 2 &&
                el.displayQuestionText.textContent.includes('スマホを毎日3時間以上') &&
                el.displayQuestionSource.textContent.includes('総務省') &&
                state.presetCorrect === 68,
                'CSV選択時の問題数自動設定・投影画面への問題文＆出典表示・正解自動セット'
            );

            // 2. Test Popup Controller Remote Command Deduplication, Full-Width Digits & postMessage Bridge
            window.postMessage({
                type: 'PB_CMD',
                action: 'LOCK_ANSWER',
                payload: {
                    respondent: 'テスト司会操作',
                    questionText: parsed[0].question,
                    answer: '６３' // Test Japanese full-width IME digits too!
                },
                cmdId: 'test_cmd_1'
            }, '*');
            await sleep(50);
            // Simulate duplicate BroadcastChannel delivery with same cmdId
            handleControllerCommand('LOCK_ANSWER', {
                answer: '99'
            }, 'test_cmd_1');
            check(
                state.currentAnswer === 63 && el.displayAnswerVal.textContent == '63',
                '別ウィンドウ postMessage 通信（file://対応）＆ 全角数字「６３」→「63%」自動変換・回答ロック表示'
            );

            // 3. Test Real Async REVEAL_CORRECT -> Drumroll -> Auto Explanation Display -> Auto-Pop (Diff 5: 68 - 63 = 5 -> 25 balloons left)
            handleControllerCommand('REVEAL_CORRECT', {
                correct: '68',
                autoPop: true
            }, 'test_cmd_2');

            // Wait for drumroll (~0.9s) + auto-pop delay (0.75s) + 5 balloon pops (~1.2s)
            await sleep(3200);
            check(
                state.currentCorrect === 68 &&
                state.remainingBalloons === 25 &&
                state.phase === 'QUESTION_DONE' &&
                state.explanationVisible === true &&
                !el.explanationPanel.classList.contains('hidden'),
                '「正解を発表！」からドラムロール ➡ 解説の自動表示 ➡ 自動バルーン破裂までの一連動作 (30 → 25個)'
            );

            // 3b. Test Explanation Toggle (Hide & Show again via controller command)
            handleControllerCommand('TOGGLE_EXPLANATION', {}, 'test_cmd_exp_1');
            const hiddenOk = state.explanationVisible === false && el.explanationPanel.classList.contains('hidden');
            handleControllerCommand('TOGGLE_EXPLANATION', {}, 'test_cmd_exp_2');
            const shownAgainOk = state.explanationVisible === true && !el.explanationPanel.classList.contains('hidden');
            check(hiddenOk && shownAgainOk, 'コントロールパネル「💡 解説を見る/隠す」ボタンによる解説の一時非表示・再表示の切り替え');

            // 4. Test Next Question auto-loads Q2 from CSV
            handleControllerCommand('NEXT_QUESTION', {}, 'test_cmd_3');
            check(
                state.currentQuestion === 2 &&
                el.displayQuestionText.textContent.includes('朝食を毎日食べる') &&
                state.presetCorrect === 74 &&
                el.explanationPanel.classList.contains('hidden'),
                '次の問題(Q.2)進行時のCSV問題文・正解(74%)の自動切り替え＆解説リセット'
            );

            // 5. Test GAME CLEAR on Q2 completion & Result Modal Hide/Show Toggle
            handleControllerCommand('LOCK_ANSWER', { answer: '70' }, 'test_cmd_4');
            state.currentCorrect = 74;
            state.remainingBalloons = 21;
            engine.initBalloons(21);
            finishQuestionRound(4, 4, false);
            showResultModal(true);
            const clearOk = state.phase === 'GAME_CLEAR' && !el.resultModal.classList.contains('hidden');
            handleControllerCommand('TOGGLE_RESULT_MODAL', {}, 'test_cmd_res_1');
            const resHiddenOk = el.resultModal.classList.contains('hidden') && !el.explanationPanel.classList.contains('hidden');
            handleControllerCommand('TOGGLE_RESULT_MODAL', {}, 'test_cmd_res_2');
            const resShownAgainOk = !el.resultModal.classList.contains('hidden');
            check(clearOk && resHiddenOk && resShownAgainOk, 'GAME CLEAR/OVER 結果画面の「閉じて問題・解説を見る」＆「結果画面を再表示」切り替え');

            // 6. Test returning to Title Screen mid-game
            handleControllerCommand('OPEN_SETUP', {}, 'test_cmd_home');
            check(state.phase === 'SETUP' && !el.setupModal.classList.contains('hidden'), '問題の途中から「🏠 タイトルへ戻る」で初期設定画面へ戻る機能');

            // 7. Reset back to clean initial state
            clearActiveTimer();
            el.btnClearCsv.click();
            el.setupPresetSelect.value = 'shuwa_easy';
            applyQuestionSetSelection();
            el.setupInitialBalloons.value = '100';
            el.setupPerfectBonus.value = '0';
            startNewGame();
        } finally {
            sound.setMuted(prevMuted);
        }

        const passedCount = results.filter(r => r.pass).length;
        const summary = results.map(r => `${r.pass ? '✅' : '❌'} ${r.name}`).join('\n');
        const reportText = `【自動セルフテスト完了: ${passedCount}/${results.length} 合格】\n\n${summary}`;

        if (new URLSearchParams(window.location.search).get('e2etest') === '1') {
            try {
                await fetch('/__test_report__', { method: 'POST', body: reportText });
            } catch (_) {}
            return;
        }
        alert(`${reportText}\n\n※初期状態にリセットしました。`);
    }

    if (el.btnRunTest) {
        el.btnRunTest.addEventListener('click', runBuiltInSelfTest);
    }

    // Headless CLI E2E Verification Mode (?e2etest=1)
    if (new URLSearchParams(window.location.search).get('e2etest') === '1') {
        setTimeout(() => {
            runBuiltInSelfTest();
        }, 100);
    }
});
