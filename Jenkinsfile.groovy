String gitlabSecretToken = '0fd20264243d503b63538824f164b1e0'

pipeline {
    agent {
        label 'AwsJenkinsSlave'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        skipStagesAfterUnstable()
    }
    triggers {
        gitlab(triggerOnPush: false,
                triggerOnMergeRequest: false,
                triggerOnAcceptedMergeRequest: true,
                branchFilterType: 'All',
                pendingBuildName: env.JOB_NAME,
                cancelPendingBuildsOnUpdate: true,
                secretToken: gitlabSecretToken
        )
    }

    environment {
        projectName           = 'HotelServiceApp'
        urlPrefix             = 'https://github.com/rupesnemade/'
        projectUrl            = "${urlPrefix}/AccomodationService.git"

        apiService_ECR_URL    = "960885402552.dkr.ecr.us-east-1.amazonaws.com/hotel/apiervice"
        workerService_ECR_URL = "960885402552.dkr.ecr.us-east-1.amazonaws.com/hotel/workerservice"
        REGION                = "us-east-1"
    }
    
    stages {
        stage('Checkout') {
            steps {
                git(
                        url: projectUrl,
                        credentialsId: "git_credentials",
                        branch: 'master'
                )
                updateGitlabCommitStatus(name: env.JOB_NAME, state: 'running')
            }
            post {
                failure {
                    cleanWs()
                }
            }
        }
        stage('API service Docker Build') {
            steps {
                dir('api') {
                    sh """docker build -t api-service ."""
                    echo "API service image build successfully"
                }
            }
        }

        stage('Worker service Docker Build') {
            steps {
                dir('worker') {
                    sh """docker build -t worker-service ."""
                    echo "Worker service image build successfully"
                }
            }
        }

        stage('ECR push') {
            steps {
                script {
                    withCredentials([[
                                             $class: 'AmazonWebServicesCredentialsBinding',
                                             credentialsId: 'AW2_UploadUser',
                                             accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                                             secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                        sh '/init.sh'

                        echo "Login to ECR"
                        sh '$(/usr/local/bin/aws ecr get-login --no-include-email --region $REGION)'

                        echo "Tag the build and push to ECR"

                        sh 'docker tag api-service $apiService_ECR_URL:latest'
                        sh 'docker push $apiService_ECR_URL:latest'

                        sh 'docker tag worker-service $workerService_ECR_URL:latest'
                        sh 'docker push $workerService_ECR_URL:latest'

                        echo "Docker images successfully pushed to ECR"
                        echo "Deleting docker image from workspace"

                        sh 'docker rmi $apiService_ECR_URL:latest'
                        sh 'docker rmi $workerService_ECR_URL:latest'
                    }
                }
            }
        }
        stage('Deploy-AWS') {
            steps {
                build job: '../AWS-Deploy/HotelService_Deploy_Dev'
            }
            post {
                always {
                    cleanWs()
                    echo "Send notifications for result: ${currentBuild.currentResult}"
                }
            }

        }
    }
    post {
        success {
            updateGitlabCommitStatus(name: env.JOB_NAME, state: 'success')
        }
        failure {
            updateGitlabCommitStatus(name: env.JOB_NAME, state: 'failed')
        }
        unstable {
            updateGitlabCommitStatus(name: env.JOB_NAME, state: 'failed')
        }
    }
}
