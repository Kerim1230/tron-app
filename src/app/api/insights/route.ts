import { NextResponse } from 'next/server';

// بيانات رؤى محاكاة لعرض التطبيق
function generateSimulatedInsights(owner: string, repo: string) {
  return {
    repository: repo,
    owner: owner,
    stars: 128,
    forks: 34,
    openIssues: 12,
    closedIssues: 156,
    openPRs: 5,
    mergedPRs: 89,
    watchers: 23,
    contributors: [
      { login: 'Kerim1230', contributions: 342, avatar: 'https://github.com/Kerim1230.png' },
      { login: 'tron-agent', contributions: 87, avatar: 'https://github.com/github.png' },
      { login: 'copilot-bot', contributions: 45, avatar: 'https://github.com/github.png' },
    ],
    languages: [
      { name: 'TypeScript', percentage: 62, color: '#3178c6' },
      { name: 'JavaScript', percentage: 18, color: '#f1e05a' },
      { name: 'CSS', percentage: 12, color: '#563d7c' },
      { name: 'YAML', percentage: 5, color: '#cb171e' },
      { name: 'Markdown', percentage: 3, color: '#083fa1' },
    ],
    recentActivity: [
      { type: 'push', message: 'تحديث واجهة GitHub Insights', time: 'منذ ساعة' },
      { type: 'pr', message: 'دمج إضافات GitHub Models API', time: 'منذ 3 ساعات' },
      { type: 'issue', message: 'إضافة دعم GitHub Actions', time: 'منذ 5 ساعات' },
      { type: 'release', message: 'إصدار TRON Σ v2.0', time: 'منذ يوم' },
    ],
    workflows: [
      { name: 'tron-skills', status: 'active', lastRun: 'منذ 30 دقيقة' },
      { name: 'codeql', status: 'active', lastRun: 'منذ ساعة' },
      { name: 'docs', status: 'active', lastRun: 'منذ 3 ساعات' },
      { name: 'deploy', status: 'active', lastRun: 'منذ 6 ساعات' },
      { name: 'agentic', status: 'active', lastRun: 'منذ يوم' },
      { name: 'container', status: 'disabled', lastRun: 'لم يشغل' },
      { name: 'release', status: 'disabled', lastRun: 'لم يشغل' },
      { name: 'insights', status: 'active', lastRun: 'منذ أسبوع' },
    ],
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner') || 'Kerim1230';
    const repo = searchParams.get('repo') || 'tron-app';
    const token = process.env.GITHUB_MODELS_TOKEN || process.env.GIT_TOKEN || process.env.GITHUB_TOKEN;

    // محاولة جلب البيانات الحقيقية
    if (token) {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'TRON-Sigma-App',
        };

        const [repoRes, contribRes, langRes] = await Promise.allSettled([
          fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
          fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`, { headers }),
          fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }),
        ]);

        if (repoRes.status === 'fulfilled' && repoRes.value.ok) {
          const repoData = await repoRes.value.json();
          const contribData = contribRes.status === 'fulfilled' && contribRes.value.ok
            ? await contribRes.value.json() : [];
          const langData = langRes.status === 'fulfilled' && langRes.value.ok
            ? await langRes.value.json() : {};

          const totalBytes = Object.values(langData).reduce((sum: number, v: unknown) => sum + (v as number), 0);
          const langColors: Record<string, string> = {
            TypeScript: '#3178c6', JavaScript: '#f1e05a', CSS: '#563d7c',
            Python: '#3572A5', HTML: '#e34c26', YAML: '#cb171e', Markdown: '#083fa1',
          };

          const languages = Object.entries(langData).map(([name, bytes]) => ({
            name,
            percentage: Math.round(((bytes as number) / totalBytes) * 100),
            color: langColors[name] || '#8b949e',
          }));

          const contributors = Array.isArray(contribData)
            ? contribData.slice(0, 10).map((c: Record<string, unknown>) => ({
                login: c.login,
                contributions: c.contributions,
                avatar: c.avatar_url,
              }))
            : [];

          return NextResponse.json({
            repository: repoData.name,
            owner,
            stars: repoData.stargazers_count || 0,
            forks: repoData.forks_count || 0,
            openIssues: repoData.open_issues_count || 0,
            watchers: repoData.watchers_count || 0,
            contributors,
            languages,
            recentActivity: generateSimulatedInsights(owner, repo).recentActivity,
            workflows: generateSimulatedInsights(owner, repo).workflows,
          });
        }
      } catch {
        // فشل - استخدام المحاكاة
      }
    }

    // استخدام البيانات المحاكاة
    return NextResponse.json(generateSimulatedInsights(owner, repo));
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
