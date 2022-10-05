async function getMetrics(github, context) {   
    //Research
    const views = await github.rest.repos.getViews({
        owner: context.repo.owner,
        repo: context.repo.repo,
        })

    //Activation
    const clones = await github.rest.repos.getClones({
        owner: context.repo.owner,
        repo: context.repo.repo,
        })
    const forks = await github.rest.repos.listForks({
    owner: context.repo.owner,
    repo: context.repo.repo,
    })

    // Retained Usage: Opening Issues, opening PRs, writing comments, posting/commenting on Discussions
    return {views: views, clones: clones, forks: forks}
} 

module.exports = ({github, context}) => getMetrics(github, context)
