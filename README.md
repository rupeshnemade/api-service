To be able to create the stated infrastructure we are using Terraform.

This Terraform module creates ECS resources on AWS.

This module focuses purely on ECS  and its dependant services. Therefore only these resources can be created with this module:

ECS
IAM
ALB
Auto-scaling groups
Security groups
Route 53 record

Inputs
Name	Description	Type	Default	Required
create_ecs	Controls if ECS should be created	string	"true"	no
name	Name to be used on all the resources as identifier, also the name of the ECS cluster	string	n/a	yes
tags	A map of tags to add to ECS Cluster	map	<map>	no
