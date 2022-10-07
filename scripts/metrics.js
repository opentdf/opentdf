import { Analytics } from 'analytics-service';

const userId = 'testuser@virtru.com';

const getAmplitudeKey = () => {
    //testing
    return '3e6592f019223965c6f403818496b6e6'
    // if (DataStore.get(STORAGE_READER_CONFIG_KEY) === 'production' || window.location.href.indexOf('//cdn.virtru.com/') >= 0) {
    //     return 'd34d3d2c70eb854183143c56c470dcb4';
    // } else {
    //     return '3e6592f019223965c6f403818496b6e6';
    // }
};

const amplitudeKey = getAmplitudeKey();

Analytics.init({
  key: amplitudeKey,
  frontEnd: true
}, userId);


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
    Analytics.track('OpenTDF Github traffic', data);
    // Retained Usage: Opening Issues, opening PRs, writing comments, posting/commenting on Discussions
    return data
} 

module.exports = ({github, context}) => getMetrics(github, context)
