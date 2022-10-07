async function getMetrics(github, context) {   
    //Research
    const views = await github.rest.repos.getViews({
        owner: context.repo.owner,
        repo: context.repo.repo,
        }).data.count

    //Activation
    const clones = await github.rest.repos.getClones({
        owner: context.repo.owner,
        repo: context.repo.repo,
        }).data.count
    const forks = await github.rest.repos.listForks({
    owner: context.repo.owner,
    repo: context.repo.repo,
    }).data.length
    const data = {
        timestamp: new Date(),
        views: views, 
        clones: clones, 
        forks: forks
    }
    // Retained Usage: Opening Issues, opening PRs, writing comments, posting/commenting on Discussions
    return data
} 

module.exports = ({github, context}) => getMetrics(github, context)
